package com.margelo.nitro.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.proguard.annotations.DoNotStrip
import com.video.core.LibraryError
import com.video.core.VideoManager
import com.video.core.VideoViewError
import com.video.core.utils.PictureInPictureUtils
import com.video.view.VideoView
import com.video.core.utils.Threading

@DoNotStrip
@OptIn(UnstableApi::class)
class HybridVideoViewViewManager(nitroId: Int): HybridVideoViewViewManagerSpec() {
  private var videoView =
    VideoManager.getVideoViewWeakReferenceByNitroId(nitroId) ?: throw VideoViewError.ViewNotFound(nitroId)

  override var player: HybridVideoPlayerSpec?
    get() {
      return Threading.runOnMainThreadSync { return@runOnMainThreadSync videoView.get()?.hybridPlayer }
    }
    set(value) {
      Threading.runOnMainThread {
        videoView.get()?.hybridPlayer = value as? HybridVideoPlayer
      }
    }

  override fun canEnterPictureInPicture(): Boolean {
    return PictureInPictureUtils.canEnterPictureInPicture()
  }

  override fun enterFullscreen() {
    videoView.get()?.enterFullscreen()
  }

  override fun exitFullscreen() {
    throw LibraryError.MethodNotSupported("exitFullscreen")
  }

  override fun enterPictureInPicture() {
    Threading.runOnMainThread {
      videoView.get()?.enterPictureInPicture()
    }
  }

  override fun exitPictureInPicture() {
    Threading.runOnMainThread {
      videoView.get()?.exitPictureInPicture()
    }
  }

  override var autoEnterPictureInPicture: Boolean
    get() = videoView.get()?.autoEnterPictureInPicture == true
    set(value) {
      videoView.get()?.autoEnterPictureInPicture = value
    }

  override var pictureInPicture: Boolean
    get() = videoView.get()?.pictureInPictureEnabled == true
    set(value) {
      videoView.get()?.pictureInPictureEnabled = value
    }

  override var controls: Boolean
    get() = videoView.get()?.useController == true
    set(value) {
      videoView.get()?.useController = value
    }

  override val memorySize: Long
    get() = 0
}
