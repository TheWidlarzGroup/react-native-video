package com.twg.video.core.player

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.video.HybridVideoPlayerSourceSpec
import androidx.core.net.toUri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.HttpDataSource
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MergingMediaSource
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.twg.video.core.LibraryError
import com.twg.video.core.SourceError
import com.twg.video.core.plugins.PluginsRegistry
import java.io.IOException
import kotlin.math.min

@OptIn(UnstableApi::class)
@Throws(SourceError::class)
fun buildMediaSource(context: Context, source: HybridVideoPlayerSource, mediaItem: MediaItem): MediaSource {
  val uri = source.uri.toUri()

  // `config.type` wins; without it the type is read from the uri (query params are ignored,
  // so they can't give a false extension).
  val type = contentTypeOverride(source.config) ?: Util.inferContentType(uri)
  val dataSourceFactory = PluginsRegistry.shared.overrideMediaDataSourceFactory(
    source,
    buildBaseDataSourceFactory(context, source)
  )

  if (!source.config.externalSubtitles.isNullOrEmpty()) {
    return buildExternalSubtitlesMediaSource(context, source)
  }

  val mediaSourceFactory: MediaSource.Factory = when (type) {
    C.CONTENT_TYPE_DASH -> {
      DashMediaSource.Factory(dataSourceFactory)
    }
    C.CONTENT_TYPE_HLS -> {
      HlsMediaSource.Factory(dataSourceFactory).apply {
        source.config.textTracksAllowChunklessPreparation?.let { setAllowChunklessPreparation(it) }
      }
    }
    C.CONTENT_TYPE_OTHER -> {
      DefaultMediaSourceFactory(context)
        .setDataSourceFactory(dataSourceFactory)
    }
    else -> {
      throw SourceError.UnsupportedContentType(source.uri)
    }
  }

  source.config.drm?.let {
    val drmSessionManager = source.drmSessionManager ?: throw LibraryError.DRMPluginNotFound
    mediaSourceFactory.setDrmSessionManagerProvider { drmSessionManager }
  }

  buildLoadErrorHandlingPolicy(source)?.let { mediaSourceFactory.setLoadErrorHandlingPolicy(it) }

  return PluginsRegistry.shared.overrideMediaSourceFactory(
    source,
    mediaSourceFactory,
    dataSourceFactory
  ).createMediaSource(mediaItem)
}

@OptIn(UnstableApi::class)
fun buildExternalSubtitlesMediaSource(context: Context, source: HybridVideoPlayerSource): MediaSource {
  val dataSourceFactory = PluginsRegistry.shared.overrideMediaDataSourceFactory(
    source,
    buildBaseDataSourceFactory(context, source)
  )

  val mediaItemBuilderWithSubtitles = MediaItem.Builder()
    .setUri(source.uri.toUri())
    .setSubtitleConfigurations(getSubtitlesConfiguration(source.config))

  overriddenMimeType(source.config)?.let { mediaItemBuilderWithSubtitles.setMimeType(it) }

  source.config.metadata?.let { metadata ->
    mediaItemBuilderWithSubtitles.setMediaMetadata(getCustomMetadata(metadata))
  }

  val mediaItemBuilder = PluginsRegistry.shared.overrideMediaItemBuilder(
    source,
    mediaItemBuilderWithSubtitles
  )

  val mediaSourceFactory = DefaultMediaSourceFactory(context)
    .setDataSourceFactory(dataSourceFactory)

  buildLoadErrorHandlingPolicy(source)?.let { mediaSourceFactory.setLoadErrorHandlingPolicy(it) }

  if (source.config.drm != null) {
    if (source.drmManager == null)  {
      throw LibraryError.DRMPluginNotFound
    }

    mediaSourceFactory.setDrmSessionManagerProvider {
      source.drmManager as DrmSessionManager
    }

    val drmConfiguration = source.drmManager!!.getDRMConfiguration(source.config.drm!!)
    mediaItemBuilder.setDrmConfiguration(drmConfiguration)
  }

  return PluginsRegistry.shared.overrideMediaSourceFactory(
    source,
    mediaSourceFactory,
    dataSourceFactory
  ).createMediaSource(mediaItemBuilder.build())
}

/**
 * The retry policy for the source, or null to keep the Media3 default (3 retries).
 */
@OptIn(UnstableApi::class)
fun buildLoadErrorHandlingPolicy(source: HybridVideoPlayerSource): LoadErrorHandlingPolicy? {
  val minLoadRetryCount = source.config.minLoadRetryCount?.toInt()?.coerceAtLeast(0)
  val keepRetryingOffline = source.config.disableDisconnectError == true

  if (keepRetryingOffline) {
    return RetryWhileDisconnectedPolicy(minLoadRetryCount ?: DefaultLoadErrorHandlingPolicy.DEFAULT_MIN_LOADABLE_RETRY_COUNT)
  }
  return minLoadRetryCount?.let { DefaultLoadErrorHandlingPolicy(it) }
}

/**
 * Retries a load that failed because the connection could not be opened for as long as it
 * takes, once a second. Every other failure is retried `minLoadRetryCount` times, then reported.
 */
@OptIn(UnstableApi::class)
class RetryWhileDisconnectedPolicy(private val minLoadRetryCount: Int) :
  DefaultLoadErrorHandlingPolicy(minLoadRetryCount) {

  override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo): Long {
    return when {
      isDisconnect(loadErrorInfo.exception) -> DISCONNECTED_RETRY_DELAY_MS
      loadErrorInfo.errorCount < minLoadRetryCount ->
        min((loadErrorInfo.errorCount - 1) * 1000L, 5000L)
      else -> C.TIME_UNSET
    }
  }

  // The delay above decides when to stop, so the loader must not stop on its own count.
  override fun getMinimumLoadableRetryCount(dataType: Int): Int = Int.MAX_VALUE

  private fun isDisconnect(exception: IOException): Boolean {
    // A server answer (4xx, 5xx, wrong content type) is not a lost connection.
    if (exception is HttpDataSource.InvalidResponseCodeException ||
      exception is HttpDataSource.InvalidContentTypeException
    ) {
      return false
    }
    return exception is HttpDataSource.HttpDataSourceException
  }

  companion object {
    private const val DISCONNECTED_RETRY_DELAY_MS = 1000L
  }
}
