package com.video.view

import android.content.Context
import android.util.AttributeSet
import android.view.SurfaceView
import android.widget.FrameLayout
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.HybridVideoPlayer
import java.lang.ref.WeakReference

@UnstableApi
class VideoView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
  var hybridPlayer: HybridVideoPlayer? = null
    set(value) {
      // Clear the SurfaceView when player is about to be set to null
      if (value == null && field != null) {
        val player = field?.playerPointer
        player?.clearVideoSurfaceView(surfaceView)
        player?.setVideoSurfaceView(null)
      }

      field = value

      // Set the SurfaceView to the player when it's available
      surfaceView?.let {
        field?.playerPointer?.setVideoSurfaceView(it)
      }
    }

  var nitroId: Int = -1
    set(value) {
      if (field == -1) {
        post {
          onNitroIdChange?.let { it(value) }
        }
      }

      field = value
      globalViewsMap[value] = WeakReference(this)
    }

  var onNitroIdChange: ((Int?) -> Unit)? = null

  private var surfaceView: SurfaceView? = null

  init {
    surfaceView = SurfaceView(context).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    }
    addView(surfaceView)
  }

  // -------- View Lifecycle Methods --------
  override fun onDetachedFromWindow() {
    hybridPlayer?.playerPointer?.clearVideoSurfaceView(surfaceView)
    super.onDetachedFromWindow()
  }

  override fun onAttachedToWindow() {
    hybridPlayer?.playerPointer?.setVideoSurfaceView(surfaceView)
    super.onAttachedToWindow()
  }

  companion object {
    private val globalViewsMap = HashMap<Int, WeakReference<VideoView>>()

    /**
     * Retrieves a VideoView WeakReference instance by Nitro ID.
     */
    fun getVideoViewWeakReferenceByNitroId(nitroId: Int): WeakReference<VideoView>? {
      return globalViewsMap[nitroId]
    }
  }
}
