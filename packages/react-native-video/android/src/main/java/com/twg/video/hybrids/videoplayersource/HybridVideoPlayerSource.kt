package com.margelo.nitro.video

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.twg.video.core.LibraryError
import com.twg.video.core.player.DRMManagerSpec
import com.twg.video.core.player.buildMediaSource
import com.twg.video.core.player.createMediaItemFromVideoConfig
import com.twg.video.core.plugins.PluginsRegistry
import com.twg.video.core.utils.VideoInformationUtils

class HybridVideoPlayerSource(): HybridVideoPlayerSourceSpec() {
  override lateinit var uri: String
  override lateinit var config: NativeVideoConfig

  private lateinit var mediaItem: MediaItem
  lateinit var mediaSource: MediaSource

  var drmManager: DRMManagerSpec? = null

  @UnstableApi
  var drmSessionManager: DrmSessionManager? = null

  constructor(config: NativeVideoConfig) : this() {
    this.uri = config.uri
    this.config = config

    val overriddenSource = PluginsRegistry.shared.overrideSource(this)

    config.drm?.let {
      drmManager = PluginsRegistry.shared.getDRMManager(this)
      drmSessionManager = drmManager?.buildDrmSessionManager(it)
    }

    this.mediaItem = createMediaItemFromVideoConfig(
      overriddenSource
    )

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
