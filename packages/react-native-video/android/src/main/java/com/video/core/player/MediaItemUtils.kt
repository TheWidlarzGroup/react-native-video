package com.video.core.player

import android.util.Log
import android.webkit.MimeTypeMap
import androidx.annotation.OptIn
import androidx.core.net.toUri
import androidx.media3.common.MediaItem
import androidx.media3.common.C
import androidx.media3.common.MimeTypes
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.NativeVideoConfig
import com.margelo.nitro.video.SubtitleType
import com.video.core.SourceError
import com.video.core.extensions.toStringExtension

private const val TAG = "MediaItemUtils"

@OptIn(UnstableApi::class)
fun createMediaItemFromVideoConfig(
  config: NativeVideoConfig
): MediaItem {
  val mediaItemBuilder = MediaItem.Builder()

  mediaItemBuilder.setUri(config.uri)

  val mediaItem = mediaItemBuilder.build()
  return mediaItem
}

fun getSubtitlesConfiguration(
  config: NativeVideoConfig,
): List<MediaItem.SubtitleConfiguration> {
  val subtitlesConfiguration: MutableList<MediaItem.SubtitleConfiguration> = mutableListOf()

  if (config.externalSubtitles != null) {
    for (subtitle in config.externalSubtitles) {
      val ext = if (subtitle.type == SubtitleType.AUTO) {
        MimeTypeMap.getFileExtensionFromUrl(subtitle.uri)
      } else {
        subtitle.type.toStringExtension()
      }

      val mimeType = when (ext?.lowercase()) {
        "srt" -> MimeTypes.APPLICATION_SUBRIP
        "vtt" -> MimeTypes.TEXT_VTT
        "ssa", "ass" -> MimeTypes.TEXT_SSA
        else -> {
          Log.e(TAG, "Unsupported subtitle extension '$ext' for URI: ${subtitle.uri}. Skipping this subtitle.")
          continue
        }
      }

      try {
        val subtitleConfig = MediaItem.SubtitleConfiguration.Builder(subtitle.uri.toUri())
          .setId("external-subtitle-${subtitle.uri}")
          .setMimeType(mimeType)
          .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
          .setRoleFlags(C.ROLE_FLAG_SUBTITLE)
          .setLabel(subtitle.label)
          .build()
        subtitlesConfiguration.add(subtitleConfig)
      } catch (e: Exception) {
        Log.e(TAG, "Error creating SubtitleConfiguration for URI ${subtitle.uri}: ${e.message}", e)
      }
    }
  }
  return subtitlesConfiguration
}
