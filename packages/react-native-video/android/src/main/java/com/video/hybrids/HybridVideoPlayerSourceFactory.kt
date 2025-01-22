package com.margelo.nitro.video

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec() {
  override fun fromUri(uri: String): HybridVideoPlayerSourceSpec {
    return HybridVideoPlayerSource(uri)
  }

  override val memorySize: Long
    get() = 0
}
