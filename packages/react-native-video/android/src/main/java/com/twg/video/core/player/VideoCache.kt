package com.twg.video.core.player

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File
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
   * @param headers the request headers of the source. They are part of the cache key.
   */
  fun wrap(
    context: Context,
    upstream: DataSource.Factory,
    headers: Map<String, String>? = null
  ): DataSource.Factory {
    val sourceHeaders = headers ?: emptyMap()
    return CacheDataSource.Factory()
      .setCache(get(context))
      .setUpstreamDataSourceFactory(upstream)
      .setCacheKeyFactory { dataSpec -> key(dataSpec.uri.toString(), sourceHeaders) }
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
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
