package com.twg.video.view

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.util.AttributeSet
import android.util.DisplayMetrics
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.annotation.RequiresApi
import androidx.core.view.isVisible
import androidx.fragment.app.FragmentActivity
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.ResizeMode
import com.margelo.nitro.video.SurfaceType
import com.margelo.nitro.video.VideoViewEvents
import com.twg.video.core.LibraryError
import com.twg.video.core.VideoManager
import com.twg.video.core.VideoViewError
import com.twg.video.core.fragments.FullscreenVideoFragment
import com.twg.video.core.fragments.PictureInPictureHelperFragment
import com.twg.video.core.utils.PictureInPictureUtils.canEnterPictureInPicture
import com.twg.video.core.utils.PictureInPictureUtils.createPictureInPictureParams
import com.twg.video.core.utils.PictureInPictureUtils.safeEnterPictureInPictureMode
import com.twg.video.core.utils.Threading.runOnMainThread
import com.twg.video.core.extensions.toAspectRatioFrameLayout
import com.twg.video.core.utils.PictureInPictureUtils
import com.twg.video.core.utils.PictureInPictureUtils.createDisabledPictureInPictureParams
import com.twg.video.core.utils.SmallVideoPlayerOptimizer
import com.twg.video.R.layout.player_view_surface
import com.twg.video.R.layout.player_view_texture

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

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        PictureInPictureUtils.safeSetPictureInPictureParams(
          if (value) createPictureInPictureParams(this)
          else createDisabledPictureInPictureParams(this)
        )
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

  var surfaceType: SurfaceType = SurfaceType.SURFACE
    set(value) {
      if (field == value) return
      field = value

      runOnMainThread {
        removeView(playerView)
        playerView.player = null
        playerView = createPlayerView()
        playerView.player = hybridPlayer?.player
        addView(playerView)
      }
    }

  var resizeMode: ResizeMode = ResizeMode.NONE
    set(value) {
      field = value
      runOnMainThread {
        applyResizeMode()
      }
    }

  var keepScreenAwake: Boolean
    get() = playerView.keepScreenOn
    set(value) {
      runOnMainThread {
        playerView.keepScreenOn = value
      }
    }

  var events = object : VideoViewEvents {
    override var onPictureInPictureChange: ((Boolean) -> Unit)? = {}
    override var onFullscreenChange: ((Boolean) -> Unit)? = {}
    override var willEnterFullscreen: (() -> Unit)? = {}
    override var willExitFullscreen: (() -> Unit)? = {}
    override var willEnterPictureInPicture: (() -> Unit)? = {}
    override var willExitPictureInPicture: (() -> Unit)? = {}
  }

  var onNitroIdChange: ((Int?) -> Unit)? = null
  var playerView = createPlayerView()
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
  private var fullscreenFragmentTag: String? = null
  private var movedToRootForPiP: Boolean = false

  val applicationContent: ReactApplicationContext
    get() {
      return NitroModules.applicationContext ?: throw LibraryError.ApplicationContextNotFound
    }

  init {
    addView(playerView)
    setupFullscreenButton()
    applyResizeMode()
  }

  private fun applyResizeMode() {
    playerView.resizeMode = resizeMode.toAspectRatioFrameLayout()
  }

  @SuppressLint("InflateParams")
  private fun createPlayerView(): PlayerView {
    return when (surfaceType) {
      SurfaceType.SURFACE -> LayoutInflater.from(context).inflate(player_view_surface, null) as PlayerView
      SurfaceType.TEXTURE -> LayoutInflater.from(context).inflate(player_view_texture, null) as PlayerView
    }.apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      setShutterBackgroundColor(Color.TRANSPARENT)
      setShowSubtitleButton(true)
      useController = false

      // Apply optimizations based on video player size if needed
      configureForSmallPlayer()
    }
  }

  private val layoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)

    // Additional layout fixes for small video players
    applySmallPlayerLayoutFixes()
  }

  override fun requestLayout() {
    super.requestLayout()

    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // This fix issue where exoplayer views where wrong sizes
    // Without it, controls, PictureInPicture, content fills, etc. don't work
    post(layoutRunnable)
  }

  @SuppressLint("PrivateResource")
  private fun setupFullscreenButton() {
    playerView.setFullscreenButtonClickListener { _ ->
      enterFullscreen()
    }

    playerView.findViewById<ImageButton>(androidx.media3.ui.R.id.exo_fullscreen)
      ?.setImageResource(androidx.media3.ui.R.drawable.exo_ic_fullscreen_enter)
  }

  fun enterFullscreen() {
    if (isInFullscreen) {
      return
    }

    val currentActivity = applicationContent.currentActivity
    if (currentActivity !is FragmentActivity) {
      Log.e("ReactNativeVideo", "Current activity is not a FragmentActivity, cannot enter fullscreen")
      return
    }

    try {
      events.willEnterFullscreen?.let { it() }

      val fragment = FullscreenVideoFragment(this)
      fullscreenFragmentTag = fragment.id

      currentActivity.supportFragmentManager.beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()

      isInFullscreen = true
    } catch (err: Exception) {
      val debugMessage = "Failed to start fullscreen fragment for nitroId: $nitroId"
      Log.e("ReactNativeVideo", debugMessage, err)
    }
  }

  @SuppressLint("PrivateResource")
  fun exitFullscreen() {
    if (!isInFullscreen) {
      return
    }

    events.willExitFullscreen?.let { it() }

    val currentActivity = applicationContent.currentActivity
    fullscreenFragmentTag?.let { tag ->
      (currentActivity as? FragmentActivity)?.let { activity ->
        activity.supportFragmentManager.findFragmentByTag(tag)?.let { fragment ->
          // The fragment will handle its own removal in exitFullscreen()
          if (fragment is FullscreenVideoFragment) {
            runOnMainThread {
              fragment.exitFullscreen()
            }
          }
        }
      }
      fullscreenFragmentTag = null
    }

    // Change fullscreen button icon back to enter fullscreen and update callback
    setupFullscreenButton()

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

  private fun removeFullscreenFragment() {
    val currentActivity = applicationContent.currentActivity
    fullscreenFragmentTag?.let { tag ->
      (currentActivity as? FragmentActivity)?.let { activity ->
        activity.supportFragmentManager.findFragmentByTag(tag)?.let { fragment ->
          activity.supportFragmentManager.beginTransaction()
            .remove(fragment)
            .commitAllowingStateLoss()
        }
      }
      fullscreenFragmentTag = null
    }
  }

  fun hideRootContentViews() {
    // Safety check: Only proceed if this is the designated PiP video
    if (VideoManager.getCurrentPictureInPictureVideo() != this) {
      Log.w("ReactNativeVideo", "hideRootContentViews called on non-PiP video nitroId: $nitroId - ignoring")
      return
    }
    
    Log.d("ReactNativeVideo", "Hiding root content views for PiP video nitroId: $nitroId")
    
    // Remove playerView from parent
    // In PiP mode, we don't want to show the controller
    // Controls are handled by System if we have MediaSession
    playerView.useController = false
    playerView.setBackgroundColor(Color.BLACK)
    playerView.setShutterBackgroundColor(Color.BLACK)

    // If we're already in fullscreen, the PlayerView is inside the fullscreen container
    // and root content is already hidden. Avoid moving the PlayerView again.
    if (isInFullscreen) {
      Log.d("ReactNativeVideo", "PiP entered while in fullscreen - skipping reparent to root for nitroId: $nitroId")
      movedToRootForPiP = false
      return
    }

    (playerView.parent as? ViewGroup)?.removeView(playerView)

    val currentActivity = applicationContent.currentActivity ?: return
    val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)
    rootContentViews = (0 until rootContent.childCount)
      .map { rootContent.getChildAt(it) }
      .filter { it.isVisible }

    rootContentViews.forEach { view -> view.visibility = GONE }

    rootContent.addView(
      playerView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    )
    movedToRootForPiP = true
    
    Log.d("ReactNativeVideo", "Successfully moved player view to root content for PiP nitroId: $nitroId")
  }

  fun restoreRootContentViews() {
    Log.d("ReactNativeVideo", "Restoring root content views for video nitroId: $nitroId")
    
    // Reset PlayerView settings
    playerView.useController = useController

    playerView.setBackgroundColor(Color.BLACK)
    playerView.setShutterBackgroundColor(Color.BLACK)

    if (movedToRootForPiP) {
      (playerView.parent as? ViewGroup)?.removeView(playerView)

      val currentActivity = applicationContent.currentActivity ?: return
      val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)

      rootContent.removeView(playerView)

      // Restore root content views
      rootContentViews.forEach { it.visibility = View.VISIBLE }
      rootContentViews = listOf()
      movedToRootForPiP = false
    }

    // Add PlayerView back to this VideoView only if not already attached
    if (playerView.parent != this) {
      addView(playerView)
    }
    
    Log.d("ReactNativeVideo", "Successfully restored root content views for video nitroId: $nitroId")
  }

  fun enterPictureInPicture() {
    if (isInPictureInPicture || isInFullscreen || !pictureInPictureEnabled) {
      return
    }

    if (!canEnterPictureInPicture()) {
      throw VideoViewError.PictureInPictureNotSupported
    }

    // Use centralized PiP manager to handle multiple videos
    VideoManager.requestPictureInPicture(this)
  }

  internal fun internalEnterPictureInPicture(): Boolean {
    if (isInPictureInPicture || isInFullscreen || !pictureInPictureEnabled) {
      return false
    }

    if (!canEnterPictureInPicture()) {
      return false
    }

    val currentActivity = applicationContent.currentActivity ?: return false

    return try {
      events.willEnterPictureInPicture?.let { it() }

      val success = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val params = createPictureInPictureParams(this)
        safeEnterPictureInPictureMode(params)
      } else {
        try {
          @Suppress("Deprecation")
          currentActivity.enterPictureInPictureMode()
          true
        } catch (e: Exception) {
          Log.e("ReactNativeVideo", "Failed to enter PiP mode (legacy)", e)
          false
        }
      }

      if (success) {
        Log.d("ReactNativeVideo", "Successfully requested PiP mode for nitroId: $nitroId")
        // Note: isInPictureInPicture will be set to true by the system callback in PictureInPictureHelperFragment
      } else {
        Log.w("ReactNativeVideo", "Failed to enter PiP mode for nitroId: $nitroId")
      }
      
      success
    } catch (e: Exception) {
      Log.e("ReactNativeVideo", "Exception in internalEnterPictureInPicture for nitroId: $nitroId", e)
      false
    }
  }

  fun exitPictureInPicture() {
    if (!isInPictureInPicture) return

    VideoManager.notifyPictureInPictureExited(this)

    events.willExitPictureInPicture?.let { it() }

    if (movedToRootForPiP) {
      restoreRootContentViews()
    } else {
      Log.d("ReactNativeVideo", "Exiting PiP while in fullscreen - no reparent needed for nitroId: $nitroId")
    }

    isInPictureInPicture = false
  }

  internal fun forceExitPictureInPicture() {
    if (!isInPictureInPicture) {
      Log.d("ReactNativeVideo", "Force exit PiP skipped for nitroId: $nitroId (not in PiP)")
      return
    }

    Log.d("ReactNativeVideo", "Force exiting PiP for nitroId: $nitroId")

    try {
      val currentActivity = applicationContent.currentActivity
      if (currentActivity?.isInPictureInPictureMode == true) {
        Log.d("ReactNativeVideo", "Activity is in PiP mode, preparing for transition")
      }
      
      events.willExitPictureInPicture?.let { it() }
      if (movedToRootForPiP) {
        restoreRootContentViews()
      } else {
        Log.d("ReactNativeVideo", "Force exit PiP while in fullscreen - no reparent needed for nitroId: $nitroId")
      }
      isInPictureInPicture = false
      
      VideoManager.notifyPictureInPictureExited(this)
      
      Log.d("ReactNativeVideo", "Successfully force exited PiP for nitroId: $nitroId")
      
    } catch (e: Exception) {
      Log.e("ReactNativeVideo", "Failed to force exit PiP mode for nitroId: $nitroId", e)
    }
  }

  // -------- View Lifecycle Methods --------
  override fun onDetachedFromWindow() {
    removePipHelper()
    removeFullscreenFragment()
    VideoManager.unregisterView(this)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      PictureInPictureUtils.safeSetPictureInPictureParams(
        createDisabledPictureInPictureParams(this)
      )
    }

    super.onDetachedFromWindow()
  }

  override fun onAttachedToWindow() {
    hybridPlayer?.movePlayerToVideoView(this)
    setupPipHelper()
    super.onAttachedToWindow()
  }

  private fun PlayerView.configureForSmallPlayer() {
    SmallVideoPlayerOptimizer.applyOptimizations(this, context, isFullscreen = false)

    // Also apply after any layout changes
    viewTreeObserver.addOnGlobalLayoutListener {
      SmallVideoPlayerOptimizer.applyOptimizations(this, context, isFullscreen = false)
    }
  }

  private fun applySmallPlayerLayoutFixes() {
    SmallVideoPlayerOptimizer.applyOptimizations(playerView, context, isFullscreen = false)
  }
}
