package com.twg.video.core.player

import android.util.Log
import android.webkit.MimeTypeMap
import androidx.annotation.OptIn
import androidx.core.net.toUri
import androidx.media3.common.MediaItem
import androidx.media3.common.C
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.BufferConfig
import com.margelo.nitro.video.CustomVideoMetadata
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.margelo.nitro.video.LivePlaybackParams
import com.margelo.nitro.video.NativeDrmParams
import com.margelo.nitro.video.NativeVideoConfig
import com.margelo.nitro.video.SubtitleType
import com.twg.video.core.LibraryError
import com.twg.video.core.SourceError
import com.twg.video.core.extensions.toStringExtension
import com.twg.video.core.plugins.PluginsRegistry

private const val TAG = "MediaItemUtils"

@OptIn(UnstableApi::class)
fun createMediaItemFromVideoConfig(
  source: HybridVideoPlayerSource
): MediaItem {
  val mediaItemBuilder = MediaItem.Builder()

  mediaItemBuilder.setUri(source.config.uri)

  source.config.drm?.let { drmParams ->
    val drmManager = source.drmManager ?: throw LibraryError.DRMPluginNotFound
    val drmConfiguration = drmManager.getDRMConfiguration(drmParams)
    mediaItemBuilder.setDrmConfiguration(drmConfiguration)
  }

  source.config.bufferConfig?.livePlayback?.let { livePlaybackParams ->
    mediaItemBuilder.setLiveConfiguration(getLiveConfiguration(livePlaybackParams))
  }

  source.config.metadata?.let { metadata ->
    mediaItemBuilder.setMediaMetadata(getCustomMetadata(metadata))
  }

  return PluginsRegistry.shared.overrideMediaItemBuilder(
    source,
    mediaItemBuilder
  ).build()
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

fun getLiveConfiguration(
  livePlaybackParams: LivePlaybackParams
): MediaItem.LiveConfiguration {
  val liveConfiguration = MediaItem.LiveConfiguration.Builder()

  livePlaybackParams.maxOffsetMs?.let {
    if (it >= 0) {
      liveConfiguration.setMaxOffsetMs(it.toLong())
    }
  }

  livePlaybackParams.minOffsetMs?.let {
    if (it >= 0) {
      liveConfiguration.setMinOffsetMs(it.toLong())
    }
  }

  livePlaybackParams.targetOffsetMs?.let {
    if (it >= 0) {
      liveConfiguration.setTargetOffsetMs(it.toLong())
    }
  }

  livePlaybackParams.maxPlaybackSpeed?.let {
    if (it >= 0) {
      liveConfiguration.setMaxPlaybackSpeed(it.toFloat())
    }
  }

  livePlaybackParams.minPlaybackSpeed?.let {
    if (it >= 0) {
      liveConfiguration.setMinPlaybackSpeed(it.toFloat())
    }
  }

  return liveConfiguration.build()
}

fun getCustomMetadata(metadata: CustomVideoMetadata): MediaMetadata {
  return MediaMetadata.Builder()
    .setDisplayTitle(metadata.title)
    .setTitle(metadata.title)
    .setSubtitle(metadata.subtitle)
    .setDescription(metadata.description)
    .setArtist(metadata.artist)
    .setArtworkUri(metadata.imageUri?.toUri())
    .build()
}
