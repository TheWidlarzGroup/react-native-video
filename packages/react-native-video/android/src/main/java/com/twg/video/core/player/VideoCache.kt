package com.twg.video.core.player

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.TransferListener
import androidx.media3.datasource.cache.Cache
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheKeyFactory
import androidx.media3.datasource.cache.ContentMetadata
import androidx.media3.datasource.cache.ContentMetadataMutations
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File
import java.io.IOException
import java.security.MessageDigest

/**
 * The on-disk cache behind `shouldCache`.
 *
 * One cache for the whole process: Media3 allows a single [SimpleCache] per directory, and
 * creating a second one for the same folder throws.
 */
@OptIn(UnstableApi::class)
object VideoCache {
  private const val DIRECTORY = "RNVCache"

  /** Least recently used files are evicted above this size. */
  private const val MAX_BYTES = 100L * 1024 * 1024

  private var cache: SimpleCache? = null

  @Synchronized
  private fun get(context: Context): SimpleCache {
    cache?.let { return it }

    val appContext = context.applicationContext
    return SimpleCache(
      File(appContext.cacheDir, DIRECTORY),
      LeastRecentlyUsedCacheEvictor(MAX_BYTES),
      StandaloneDatabaseProvider(appContext)
    ).also { cache = it }
  }

  /**
   * Wraps [upstream] so that what it downloads is written to the cache and read from it next time.
   * A cache that cannot be read or written never fails playback: the request goes upstream.
   *
   * A file that is only partly on disk is checked against the server before it is used again,
   * so a file that was replaced under the same address is downloaded anew.
   *
   * @param headers the request headers of the source. They are part of the cache key.
   */
  fun wrap(
    context: Context,
    upstream: DataSource.Factory,
    headers: Map<String, String>? = null
  ): DataSource.Factory {
    val sourceHeaders = headers ?: emptyMap()
    val cache = get(context)
    val keyFactory = CacheKeyFactory { dataSpec -> key(dataSpec.uri.toString(), sourceHeaders) }

    return DataSource.Factory {
      // Shared by the two wrappers of one data source: the network side sees the redirected
      // uri, so it takes the key from the side that sees the uri of the source.
      val file = CachedFile()
      val cached = CacheDataSource.Factory()
        .setCache(cache)
        .setUpstreamDataSourceFactory { VersionRecordingDataSource(upstream.createDataSource(), cache, file) }
        .setCacheKeyFactory(keyFactory)
        .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        .createDataSource()
      VersionCheckingDataSource(cached, cache, upstream, keyFactory, file)
    }
  }

  /**
   * The headers are part of the key: a file fetched with one Authorization header must not be
   * played for a source with another one. A refreshed token therefore starts a new file.
   * Same recipe as VideoCache.swift on iOS: SHA-256 of the uri and the sorted
   * `lowercased-name:value` header lines, joined with new lines.
   */
  internal fun key(uri: String, headers: Map<String, String>): String {
    val headerLines = headers.map { "${it.key.lowercase()}:${it.value}" }.sorted()
    val text = (listOf(uri) + headerLines).joinToString("\n")
    return MessageDigest.getInstance("SHA-256")
      .digest(text.toByteArray(Charsets.UTF_8))
      .joinToString("") { "%02x".format(it) }
  }
}

private const val METADATA_VERSION = "rnv_version"

/** The cache key of the file a data source is reading. */
private class CachedFile {
  var key: String? = null
}

/**
 * What tells two versions of a file apart: `Last-Modified`, or the `ETag` when there is none.
 * A weak ETag counts like a strong one.
 */
private fun versionOf(headers: Map<String, List<String>>): String? {
  fun header(name: String): String? =
    headers.entries.firstOrNull { it.key.equals(name, ignoreCase = true) }?.value?.firstOrNull()?.trim()

  header("Last-Modified")?.takeIf { it.isNotEmpty() }?.let { return "modified:$it" }
  return header("ETag")?.removePrefix("W/")?.takeIf { it.isNotEmpty() }?.let { "etag:$it" }
}

/** The length of the whole file from `Content-Range: bytes 0-0/1234`, or null when it is not given. */
private fun totalLengthOf(headers: Map<String, List<String>>): Long? {
  val contentRange = headers.entries
    .firstOrNull { it.key.equals("Content-Range", ignoreCase = true) }?.value?.firstOrNull() ?: return null
  return contentRange.substringAfterLast('/', "").trim().toLongOrNull()
}

/** Passes everything to [delegate]; subclasses change [open]. */
@OptIn(UnstableApi::class)
private open class ForwardingDataSource(protected val delegate: DataSource) : DataSource {
  override fun addTransferListener(transferListener: TransferListener) = delegate.addTransferListener(transferListener)
  override fun open(dataSpec: DataSpec): Long = delegate.open(dataSpec)
  override fun read(buffer: ByteArray, offset: Int, length: Int): Int = delegate.read(buffer, offset, length)
  override fun getUri(): Uri? = delegate.uri
  override fun getResponseHeaders(): Map<String, List<String>> = delegate.responseHeaders
  override fun close() = delegate.close()
}

/**
 * Sits between the cache and the network and remembers which version of the file the cached
 * bytes come from.
 */
@OptIn(UnstableApi::class)
private class VersionRecordingDataSource(
  delegate: DataSource,
  private val cache: Cache,
  private val file: CachedFile
) : ForwardingDataSource(delegate) {
  override fun open(dataSpec: DataSpec): Long {
    val length = delegate.open(dataSpec)
    val key = file.key ?: return length
    try {
      val version = versionOf(delegate.responseHeaders)
      if (version != null && cache.getContentMetadata(key).get(METADATA_VERSION, null as String?) == null) {
        cache.applyContentMetadataMutations(key, ContentMetadataMutations().set(METADATA_VERSION, version))
      }
    } catch (_: IOException) {
      // The version is only a safeguard, playback goes on without it.
    }
    return length
  }
}

/**
 * Sits above the cache. Before a file that is only partly on disk is used, it asks the server
 * for one byte and drops the cached part when the version or the length is different.
 * A complete file is played from disk without a request, and without a connection the cached
 * part is used as it is.
 */
@OptIn(UnstableApi::class)
private class VersionCheckingDataSource(
  delegate: DataSource,
  private val cache: Cache,
  private val upstream: DataSource.Factory,
  private val keyFactory: CacheKeyFactory,
  private val file: CachedFile
) : ForwardingDataSource(delegate) {
  private var checked = false

  override fun open(dataSpec: DataSpec): Long {
    val key = keyFactory.buildCacheKey(dataSpec)
    file.key = key
    if (!checked) {
      checked = true
      dropStaleFile(dataSpec, key)
    }
    return delegate.open(dataSpec)
  }

  private fun dropStaleFile(dataSpec: DataSpec, key: String) {
    try {
      val metadata = cache.getContentMetadata(key)
      val storedLength = ContentMetadata.getContentLength(metadata)
      val cachedBytes = cache.getCachedBytes(key, 0, C.LENGTH_UNSET.toLong())
      val isComplete = storedLength != C.LENGTH_UNSET.toLong() && cachedBytes >= storedLength
      if (cachedBytes <= 0 || isComplete) return

      val storedVersion = metadata.get(METADATA_VERSION, null as String?)
      val probe = upstream.createDataSource()
      val headers = try {
        probe.open(
          DataSpec.Builder()
            .setUri(dataSpec.uri)
            .setHttpRequestHeaders(dataSpec.httpRequestHeaders)
            .setPosition(0)
            .setLength(1)
            .build()
        )
        probe.responseHeaders
      } finally {
        probe.close()
      }

      val version = versionOf(headers)
      val totalLength = totalLengthOf(headers)
      val versionChanged = storedVersion != null && version != null && storedVersion != version
      val lengthChanged = storedLength != C.LENGTH_UNSET.toLong() && totalLength != null && totalLength != storedLength
      if (!versionChanged && !lengthChanged) return

      cache.removeResource(key)
      val mutations = ContentMetadataMutations()
      if (version != null) mutations.set(METADATA_VERSION, version) else mutations.remove(METADATA_VERSION)
      cache.applyContentMetadataMutations(key, mutations)
    } catch (_: IOException) {
      // No connection, or the cache can't be read: play what is there.
    }
  }
}
