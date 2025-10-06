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
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MergingMediaSource
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.twg.video.core.LibraryError
import com.twg.video.core.SourceError
import com.twg.video.core.plugins.PluginsRegistry

@OptIn(UnstableApi::class)
@Throws(SourceError::class)
fun buildMediaSource(context: Context, source: HybridVideoPlayerSource, mediaItem: MediaItem): MediaSource {
  val uri = source.uri.toUri()

  // Explanation:
  // 1. Remove query params from uri to avoid getting false extension
  // 2. Get extension from uri
  val type = Util.inferContentType(uri)
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
      HlsMediaSource.Factory(dataSourceFactory)
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

  source.config.metadata?.let { metadata ->
    mediaItemBuilderWithSubtitles.setMediaMetadata(getCustomMetadata(metadata))
  }

  val mediaItemBuilder = PluginsRegistry.shared.overrideMediaItemBuilder(
    source,
    mediaItemBuilderWithSubtitles
  )

  val mediaSourceFactory = DefaultMediaSourceFactory(context)
    .setDataSourceFactory(dataSourceFactory)

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


