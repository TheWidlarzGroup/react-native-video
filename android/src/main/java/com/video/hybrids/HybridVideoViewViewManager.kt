package com.margelo.nitro.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.proguard.annotations.DoNotStrip
import com.video.VideoView
import com.video.utils.Threading

@DoNotStrip
@OptIn(UnstableApi::class)
class HybridVideoViewViewManager(nitroId: Int): HybridVideoViewViewManagerSpec() {
  private var videoView = VideoView.getVideoViewWeakReferenceByNitroId(nitroId) ?: throw Exception("VideoView with passed nitroId does not exists")

  override var player: HybridVideoPlayerSpec?
    get() {
      return Threading.runOnMainThreadSync { return@runOnMainThreadSync videoView.get()?.player }
    }
    set(value) {
      Threading.runOnMainThread {
        videoView.get()?.player = value as? HybridVideoPlayer
      }
    }

  override val memorySize: Long
    get() = 0
}
