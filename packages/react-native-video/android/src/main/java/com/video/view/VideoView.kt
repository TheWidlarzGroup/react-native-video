package com.video.view

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.core.view.isVisible
import androidx.fragment.app.FragmentActivity
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.VideoViewEvents
import com.video.core.LibraryError
import com.video.core.VideoManager
import com.video.core.VideoViewError
import com.video.core.activities.FullscreenVideoViewActivity
import com.video.core.fragments.PictureInPictureHelperFragment
import com.video.core.utils.PictureInPictureUtils.canEnterPictureInPicture
import com.video.core.utils.PictureInPictureUtils.createPictureInPictureParams
import com.video.core.utils.Threading.runOnMainThread

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
        VideoManager.removeViewFromPlayer(this, field!!)
      }

      field = value

      field?.movePlayerToVideoView(this)
    }

  var nitroId: Int = -1
    set(value) {
      if (field == -1) {
        post {
          onNitroIdChange?.let { it(value) }
          VideoManager.registerView(this)
        }
      }

      VideoManager.updateVideoViewNitroId(oldNitroId = field, newNitroId = value, view = this)
      field = value
    }

  var autoEnterPictureInPicture: Boolean = false
    set(value) {
      field = value
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        try {
          val currentActivity = applicationContent.currentActivity
          currentActivity?.setPictureInPictureParams(createPictureInPictureParams(this))
        } catch (_: Exception) {}
      }
    }

  var useController: Boolean = false
    set(value) {
      field = value
      runOnMainThread {
        playerView.useController = value
      }
    }

  var pictureInPictureEnabled: Boolean = false

  var events = object : VideoViewEvents {
    override var onPictureInPictureChange: ((Boolean) -> Unit)? = {}
    override var onFullscreenChange: ((Boolean) -> Unit)? = {}
    override var willEnterFullscreen: (() -> Unit)? = {}
    override var willExitFullscreen: (() -> Unit)? = {}
    override var willEnterPictureInPicture: (() -> Unit)? = {}
    override var willExitPictureInPicture: (() -> Unit)? = {}
  }

  var onNitroIdChange: ((Int?) -> Unit)? = null
  var playerView = PlayerView(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    setShutterBackgroundColor(Color.TRANSPARENT)
    setShowSubtitleButton(true)
    useController = false
  }
  var isInFullscreen: Boolean = false
    set(value) {
      field = value
      events.onFullscreenChange?.let { it(value) }
    }
  var isInPictureInPicture: Boolean = false
    set(value) {
      field = value
      events.onPictureInPictureChange?.let { it(value) }
    }
  private var rootContentViews: List<View> = listOf()
  private var pictureInPictureHelperTag: String? = null

  val applicationContent: ReactApplicationContext
    get() {
      return NitroModules.applicationContext ?: throw LibraryError.ApplicationContextNotFound
    }

  init {
    addView(playerView)
    setupFullscreenButton()
  }

  private val layoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun requestLayout() {
    super.requestLayout()

    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // This fix issue where exoplayer views where wrong sizes
    // Without it, controls, PictureInPicture, content fills, etc. don't work
    post(layoutRunnable)
  }

  private fun setupFullscreenButton() {
    playerView.setFullscreenButtonClickListener { _ ->
      enterFullscreen()
    }
  }

  fun enterFullscreen() {
    if (isInFullscreen) {
      return
    }

    isInFullscreen = true

    val intent = Intent(context, FullscreenVideoViewActivity::class.java)
    intent.putExtra("nitroId", nitroId)

    try {
      val currentActivity = applicationContent.currentActivity
      currentActivity?.startActivity(intent)
    } catch (err: Exception) {
      val debugMessage = "Failed to start fullscreen activity for nitroId: $nitroId"
      Log.e("ReactNativeVideo", debugMessage, err)
    }
  }

  @SuppressLint("PrivateResource")
  fun exitFullscreen() {
    // Change fullscreen button icon back to enter fullscreen
    playerView.findViewById<ImageButton>(androidx.media3.ui.R.id.exo_fullscreen)
      ?.setImageResource(androidx.media3.ui.R.drawable.exo_ic_fullscreen_enter)

    isInFullscreen = false
  }

  private fun setupPipHelper() {
    if (!canEnterPictureInPicture()) {
      return
    }

    val currentActivity = applicationContent.currentActivity
    (currentActivity as? FragmentActivity)?.let {
      val fragment = PictureInPictureHelperFragment(this)
      pictureInPictureHelperTag = fragment.id
      it.supportFragmentManager.beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()
    }
  }

  private fun removePipHelper() {
    val currentActivity = applicationContent.currentActivity
    pictureInPictureHelperTag?.let { tag ->
      (currentActivity as? FragmentActivity)?.let { activity ->
        activity.supportFragmentManager.findFragmentByTag(tag)?.let { fragment ->
          activity.supportFragmentManager.beginTransaction()
            .remove(fragment)
            .commitAllowingStateLoss()
        }
      }
      pictureInPictureHelperTag = null
    }
  }

  fun hideRootContentViews() {
    // Remove playerView from parent
    // In PiP mode, we don't want to show the controller
    // Controls are handled by System if we have MediaSession
    playerView.useController = false
    (playerView.parent as? ViewGroup)?.removeView(playerView)

    val currentActivity = applicationContent.currentActivity ?: return
    val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)
    rootContentViews = (0 until rootContent.childCount)
      .map { rootContent.getChildAt(it) }
      .filter { it.isVisible }

    rootContentViews.forEach { view ->
      view.visibility = GONE
    }

    rootContent.addView(playerView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    )
  }

  fun restoreRootContentViews() {
    // Reset PlayerView settings
    playerView.useController = useController

    val currentActivity = applicationContent.currentActivity ?: return
    val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)
    rootContent.removeView(playerView)

    // Restore root content views
    rootContentViews.forEach { it.visibility = View.VISIBLE }
    rootContentViews = listOf()

    // Add PlayerView back to VideoView
    addView(playerView)
  }

  fun enterPictureInPicture() {
    if (isInPictureInPicture || isInFullscreen || !pictureInPictureEnabled) {
      return
    }

    if (!canEnterPictureInPicture()) {
      throw VideoViewError.PictureInPictureNotSupported
    }

    val currentActivity = applicationContent.currentActivity ?: return

    events.willEnterPictureInPicture?.let { it() }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val params = createPictureInPictureParams(this)
      currentActivity.enterPictureInPictureMode(params)
    } else {
      @Suppress("Deprecation")
      currentActivity.enterPictureInPictureMode()
    }

    isInPictureInPicture = true
  }

  fun exitPictureInPicture() {
    if (!isInPictureInPicture || isInFullscreen) {
      return
    }
    events.willExitPictureInPicture?.let { it() }
    restoreRootContentViews()
    isInPictureInPicture = false
  }

  // -------- View Lifecycle Methods --------
  override fun onDetachedFromWindow() {
    removePipHelper()
    VideoManager.unregisterView(this)
    super.onDetachedFromWindow()
  }

  override fun onAttachedToWindow() {
    hybridPlayer?.movePlayerToVideoView(this)
    setupPipHelper()
    super.onAttachedToWindow()
  }
}
