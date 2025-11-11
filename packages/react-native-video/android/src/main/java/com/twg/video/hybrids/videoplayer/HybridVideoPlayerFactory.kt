package com.margelo.nitro.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class HybridVideoPlayerFactory(): HybridVideoPlayerFactorySpec() {
  @OptIn(UnstableApi::class)
  override fun createPlayer(source: HybridVideoPlayerSourceSpec): HybridVideoPlayerSpec {
    return HybridVideoPlayer(source as HybridVideoPlayerSource)
  }

  override val memorySize: Long
    get() = 0
}
