package com.margelo.nitro.video

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec() {
  override fun fromUri(uri: String): HybridVideoPlayerSourceSpec {
    val config = NativeVideoConfig(
      uri = uri,
      externalSubtitles = null,
      drm = null,
      headers = null,
      bufferConfig = null,
      metadata = null,
      initializeOnCreation = true
    )

    return HybridVideoPlayerSource(config)
  }

  override fun fromVideoConfig(config: NativeVideoConfig): HybridVideoPlayerSourceSpec {
    return HybridVideoPlayerSource(config)
  }

  override val memorySize: Long
    get() = 0
}
