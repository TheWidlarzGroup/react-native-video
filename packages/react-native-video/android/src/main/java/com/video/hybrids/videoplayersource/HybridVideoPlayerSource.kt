package com.margelo.nitro.video

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.source.MediaSource
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.video.core.LibraryError
import com.video.core.player.DRMManagerSpec
import com.video.core.player.buildMediaSource
import com.video.core.player.createMediaItemFromVideoConfig
import com.video.core.plugins.PluginsRegistry
import com.video.core.utils.VideoInformationUtils

class HybridVideoPlayerSource(): HybridVideoPlayerSourceSpec() {
  override lateinit var uri: String
  override lateinit var config: NativeVideoConfig

  private lateinit var mediaItem: MediaItem
  lateinit var mediaSource: MediaSource

  var drmManager: DRMManagerSpec? = null

  constructor(config: NativeVideoConfig) : this() {
    this.uri = config.uri
    this.config = config

    val overriddenSource = PluginsRegistry.shared.overrideSource(this)

    this.mediaItem = createMediaItemFromVideoConfig(
      overriddenSource
    )

    if (config.drm != null) {
      drmManager = PluginsRegistry.shared.getDRMManager(this)
    }

    NitroModules.applicationContext?.let {
      this.mediaSource = buildMediaSource(
        context = it,
        source = overriddenSource,
        mediaItem
      )
    } ?: run {
      throw LibraryError.ApplicationContextNotFound
    }
  }

  override fun getAssetInformationAsync(): Promise<VideoInformation> {
    return Promise.async {
      return@async VideoInformationUtils.fromUri(uri, config.headers ?: emptyMap())
    }
  }

  override val memorySize: Long
    get() = 0
}
