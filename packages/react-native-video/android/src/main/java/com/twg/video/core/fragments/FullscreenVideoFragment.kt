package com.twg.video.core.fragments

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.activity.OnBackPressedCallback
import androidx.annotation.OptIn
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.media3.common.util.UnstableApi
import com.twg.video.core.utils.PictureInPictureUtils.createPictureInPictureParams
import com.twg.video.core.utils.SmallVideoPlayerOptimizer
import com.twg.video.view.VideoView
import java.util.UUID

@OptIn(UnstableApi::class)
class FullscreenVideoFragment(private val videoView: VideoView) : Fragment() {
  val id: String = UUID.randomUUID().toString()

  private var container: FrameLayout? = null
  private var originalPlayerParent: ViewGroup? = null
  private var originalPlayerLayoutParams: ViewGroup.LayoutParams? = null
  private var rootContentViews: List<View> = listOf()

  // Back press callback to handle back navigation
  private val backPressCallback = object : OnBackPressedCallback(true) {
    override fun handleOnBackPressed() {
      videoView.exitFullscreen()
    }
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    // Create a fullscreen container
    this.container = FrameLayout(requireContext()).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
      setBackgroundColor(android.graphics.Color.BLACK)
      keepScreenOn = true
    }
    return this.container
  }

  override fun onResume() {
    super.onResume()

    // System UI is re-enabled when user have exited app and go back
    // We need to hide it again
    hideSystemUI()
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    // Register back press callback
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backPressCallback)

    enterFullscreenMode()
    setupPlayerView()
    hideSystemUI()

    // Update PiP params if supported
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val params = createPictureInPictureParams(videoView)
        requireActivity().setPictureInPictureParams(params)
      } catch (_: Exception) {}
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    // Handle PiP mode changes
    val isInPictureInPictureMode =
      requireActivity().isInPictureInPictureMode

    if (isInPictureInPictureMode) {
      videoView.playerView.useController = false
    } else {
      videoView.playerView.useController = videoView.useController
    }
  }

  private fun enterFullscreenMode() {
    // Store original parent and layout params
    originalPlayerParent = videoView.playerView.parent as? ViewGroup
    originalPlayerLayoutParams = videoView.playerView.layoutParams

    // Remove player from original parent
    originalPlayerParent?.removeView(videoView.playerView)

    // Hide all root content views
    val currentActivity = requireActivity()
    val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)
    rootContentViews = (0 until rootContent.childCount)
      .map { rootContent.getChildAt(it) }
      .filter { it.isVisible }

    rootContentViews.forEach { view ->
      view.visibility = View.GONE
    }

    // Add our fullscreen container to root
    rootContent.addView(container,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
  }

  private fun setupPlayerView() {
    // Add PlayerView to our container
    container?.addView(videoView.playerView,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    )

    videoView.playerView.setBackgroundColor(android.graphics.Color.BLACK)
    videoView.playerView.setShutterBackgroundColor(android.graphics.Color.BLACK)

    // We need show controls in fullscreen
    videoView.playerView.useController = true

    setupFullscreenButton()
    videoView.playerView.setShowSubtitleButton(true)
    
    // Apply optimizations based on video player size in fullscreen mode
    SmallVideoPlayerOptimizer.applyOptimizations(videoView.playerView, requireContext(), isFullscreen = true)
  }

  @SuppressLint("PrivateResource")
  private fun setupFullscreenButton() {
    videoView.playerView.setFullscreenButtonClickListener { _ ->
      videoView.exitFullscreen()
    }

    // Change icon to exit fullscreen
    val button = videoView.playerView.findViewById<ImageButton>(androidx.media3.ui.R.id.exo_fullscreen)
    button?.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit)
  }

  @Suppress("DEPRECATION")
  private fun hideSystemUI() {
    val currentActivity = requireActivity()
    container?.let { container ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        container.fitsSystemWindows = false
        container.windowInsetsController?.let { controller ->
          controller.hide(WindowInsets.Type.systemBars())
          controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
      } else {
        currentActivity.window.decorView.systemUiVisibility = (
          View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
      }
    }
  }

  @Suppress("DEPRECATION")
  private fun restoreSystemUI() {
    val currentActivity = requireActivity()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      container?.windowInsetsController?.show(WindowInsets.Type.systemBars())
    } else {
      currentActivity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
    }
  }

  fun exitFullscreen() {
    // Remove back press callback since we're exiting
    backPressCallback.remove()

    restoreSystemUI()

    if (videoView.useController == false) {
      videoView.playerView.useController = false
    }

    // Ensure PlayerView keeps black background when returning to normal mode
    videoView.playerView.setBackgroundColor(android.graphics.Color.BLACK)
    videoView.playerView.setShutterBackgroundColor(android.graphics.Color.BLACK)

  // Remove PlayerView from our container
  container?.removeView(videoView.playerView)

    // Remove our container from root
    val currentActivity = requireActivity()
    val rootContent = currentActivity.window.decorView.findViewById<ViewGroup>(android.R.id.content)
    rootContent.removeView(container)

    // Restore root content views
    rootContentViews.forEach { it.visibility = View.VISIBLE }
    rootContentViews = listOf()

    // Safely restore PlayerView to original parent
    // First, ensure PlayerView is removed from any current parent
    val currentParent = videoView.playerView.parent as? ViewGroup
    currentParent?.removeView(videoView.playerView)

    // Now add it back to the original parent if it's not already the parent
    if (videoView.playerView.parent != originalPlayerParent) {
      originalPlayerParent?.addView(videoView.playerView, originalPlayerLayoutParams)
    }

    // Remove this fragment
    parentFragmentManager.beginTransaction()
      .remove(this)
      .commitAllowingStateLoss()

    // Notify VideoView that we've exited fullscreen
    videoView.isInFullscreen = false
  }



  override fun onDestroy() {
    super.onDestroy()

    // Ensure we clean up properly if fragment is destroyed
    if (videoView.isInFullscreen) {
      exitFullscreen()
    }
  }
}
