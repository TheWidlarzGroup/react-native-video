package com.video.core.player

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
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MergingMediaSource
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.video.core.SourceError

@OptIn(UnstableApi::class)
@Throws(SourceError::class)
fun buildMediaSource(context: Context, source: HybridVideoPlayerSourceSpec, mediaItem: MediaItem): MediaSource {
  val uri = source.uri.toUri()

  // Explanation:
  // 1. Remove query params from uri to avoid getting false extension
  // 2. Get extension from uri
  val type = Util.inferContentType(uri)
  val dataSourceFactory = buildBaseDataSourceFactory(context, source)

  if (!source.config.externalSubtitles.isNullOrEmpty()) {
    return buildExternalSubtitlesMediaSource(context, source)
  }

  return when (type) {
    C.CONTENT_TYPE_DASH -> {
      DashMediaSource.Factory(dataSourceFactory)
        .createMediaSource(mediaItem)
    }
    C.CONTENT_TYPE_HLS -> {
      HlsMediaSource.Factory(dataSourceFactory)
        .createMediaSource(mediaItem)
    }
    C.CONTENT_TYPE_OTHER -> {
      DefaultMediaSourceFactory(context)
        .setDataSourceFactory(dataSourceFactory)
        .createMediaSource(mediaItem)
    }
    else -> {
      throw SourceError.UnsupportedContentType(source.uri)
    }
  }
}

@OptIn(UnstableApi::class)
fun buildExternalSubtitlesMediaSource(context: Context, source: HybridVideoPlayerSourceSpec): MediaSource {
  val dataSourceFactory = buildBaseDataSourceFactory(context, source)
  val mediaItem = MediaItem.Builder()
    .setUri(source.uri.toUri())
    .setSubtitleConfigurations(getSubtitlesConfiguration(source.config))
    .build()

  return DefaultMediaSourceFactory(context)
    .setDataSourceFactory(dataSourceFactory)
    .createMediaSource(mediaItem)
}


