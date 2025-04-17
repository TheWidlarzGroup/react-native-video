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
import com.video.core.SourceError

@OptIn(UnstableApi::class)
@Throws(SourceError::class)
fun buildMediaSource(context: Context, source: HybridVideoPlayerSourceSpec, mediaItem: MediaItem): MediaSource {
  val uri = source.uri.toUri()

  // Explanation:
  // 1. Remove query params from uri to avoid getting false extension
  // 2. Get extension from uri
  val type = Util.inferContentType(uri)

  return when(type) {
    C.CONTENT_TYPE_DASH -> {
      val mediaSourceFactory = DashMediaSource.Factory(buildBaseDataSourceFactory(context, source))
      return mediaSourceFactory.createMediaSource(mediaItem)
    }

    C.CONTENT_TYPE_HLS -> {
      val mediaSourceFactory = HlsMediaSource.Factory(buildBaseDataSourceFactory(context, source))
      return mediaSourceFactory.createMediaSource(mediaItem)
    }

    C.CONTENT_TYPE_OTHER -> {
      return when (uri.scheme) {
        else -> {
          val mediaSourceFactory = DefaultMediaSourceFactory(context)
            .setDataSourceFactory(buildBaseDataSourceFactory(context, source))
          return mediaSourceFactory.createMediaSource(mediaItem)
        }
      }
    }

    else -> {
      throw SourceError.UnsupportedContentType(source.uri)
    }
  }
}


