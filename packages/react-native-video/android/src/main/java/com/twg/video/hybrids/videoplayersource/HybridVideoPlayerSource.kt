package com.margelo.nitro.video

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.twg.video.core.LibraryError
import com.twg.video.core.ads.AdsMediaSourceWrapper
import com.twg.video.core.player.DRMManagerSpec
import com.twg.video.core.player.buildMediaSource
import com.twg.video.core.player.createMediaItemFromVideoConfig
import com.twg.video.core.plugins.PluginsRegistry
import com.twg.video.core.utils.SourceLoader
import com.twg.video.core.utils.VideoInformationUtils

class HybridVideoPlayerSource(): HybridVideoPlayerSourceSpec() {
  override lateinit var uri: String
  override lateinit var config: NativeVideoConfig

  private lateinit var mediaItem: MediaItem
  lateinit var mediaSource: MediaSource

  /**
   * The source actually handed to [buildMediaSource] (after `PluginsRegistry.overrideSource`).
   * Kept so the ads-wrapped media source can be rebuilt later, at `activateAds()` time,
   * from exactly the same inputs.
   */
  private lateinit var resolvedSource: HybridVideoPlayerSource

  var drmManager: DRMManagerSpec? = null

  @UnstableApi
  var drmSessionManager: DrmSessionManager? = null

  internal val sourceLoader = SourceLoader()

  constructor(config: NativeVideoConfig) : this() {
    this.uri = config.uri
    this.config = config

    val overriddenSource = PluginsRegistry.shared.overrideSource(this)
    this.resolvedSource = overriddenSource

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

  /**
   * Rebuilds this source's [MediaSource], optionally wrapping it in an `AdsMediaSource`.
   *
   * Used by `HybridVideoPlayer.activateAds()`: the eagerly-built [mediaSource] is the plain
   * content source (ads can't be wired up at construction time - no `ExoPlayer` or
   * `PlayerView` exists yet), so the ads-wrapped source is built on activation from exactly
   * the same inputs.
   */
  @UnstableApi
  internal fun createMediaSource(adsMediaSourceWrapper: AdsMediaSourceWrapper): MediaSource {
    val context = NitroModules.applicationContext ?: throw LibraryError.ApplicationContextNotFound
    return buildMediaSource(context, resolvedSource, mediaItem, adsMediaSourceWrapper)
  }

  override fun getAssetInformationAsync(): Promise<VideoInformation> {
    return Promise.async {
      return@async sourceLoader.load {
        VideoInformationUtils.fromUri(uri, config.headers ?: emptyMap())
      }
    }
  }

  override val memorySize: Long
    get() = 0
}
