package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.ui.LegacyPlayerControlView
import com.brentvatne.common.api.ControlsConfig
import com.brentvatne.common.toolbox.DebugLog
import java.lang.ref.WeakReference

@SuppressLint("PrivateResource")
class FullScreenPlayerView(
    context: Context,
    private val exoPlayerView: ExoPlayerView,
    private val reactExoplayerView: ReactExoplayerView,
    private val playerControlView: LegacyPlayerControlView?,
    private val onBackPressedCallback: OnBackPressedCallback,
    private val controlsConfig: ControlsConfig
) : Dialog(context, android.R.style.Theme_Black_NoTitleBar) {

    private var parent: ViewGroup? = null
    private val containerView = FrameLayout(context)
    private val mKeepScreenOnHandler = Handler(Looper.getMainLooper())
    private val mKeepScreenOnUpdater = KeepScreenOnUpdater(this)

    // As this view is fullscreen we need to save initial state and restore it afterward
    // Following variables save UI state when open the view
    // restoreUIState, will reapply these values
    private var initialSystemBarsBehavior: Int? = null
    private var initialNavigationBarIsVisible: Boolean? = null
    private var initialNotificationBarIsVisible: Boolean? = null

    private class KeepScreenOnUpdater(fullScreenPlayerView: FullScreenPlayerView) : Runnable {
        private val mFullscreenPlayer = WeakReference(fullScreenPlayerView)

        override fun run() {
            try {
                val fullscreenVideoPlayer = mFullscreenPlayer.get()
                if (fullscreenVideoPlayer != null) {
                    val window = fullscreenVideoPlayer.window
                    if (window != null) {
                        val isPlaying = fullscreenVideoPlayer.exoPlayerView.isPlaying
                        if (isPlaying) {
                            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        }
                    }
                    fullscreenVideoPlayer.mKeepScreenOnHandler.postDelayed(this, UPDATE_KEEP_SCREEN_ON_FLAG_MS)
                }
            } catch (ex: Exception) {
                DebugLog.e("ExoPlayer Exception", "Failed to flag FLAG_KEEP_SCREEN_ON on fullscreen.")
                DebugLog.e("ExoPlayer Exception", ex.toString())
            }
        }

        companion object {
            private const val UPDATE_KEEP_SCREEN_ON_FLAG_MS = 200L
        }
    }

    init {
        setContentView(containerView, generateDefaultLayoutParams())

        window?.let {
            val inset = WindowInsetsControllerCompat(it, it.decorView)
            initialSystemBarsBehavior = inset.systemBarsBehavior
            initialNavigationBarIsVisible = ViewCompat.getRootWindowInsets(it.decorView)
                ?.isVisible(WindowInsetsCompat.Type.navigationBars()) == true
            initialNotificationBarIsVisible = ViewCompat.getRootWindowInsets(it.decorView)
                ?.isVisible(WindowInsetsCompat.Type.statusBars()) == true
        }
    }

    override fun onStart() {
        super.onStart()
        parent = exoPlayerView.parent as ViewGroup?
        parent?.removeView(exoPlayerView)
        containerView.addView(exoPlayerView, generateDefaultLayoutParams())
        playerControlView?.let {
            parent?.removeView(it)
            containerView.addView(it, generateDefaultLayoutParams())
        }
        updateNavigationBarVisibility()
    }

    override fun onStop() {
        super.onStop()
        mKeepScreenOnHandler.removeCallbacks(mKeepScreenOnUpdater)
        containerView.removeView(exoPlayerView)
        parent?.addView(exoPlayerView, generateDefaultLayoutParams())
        playerControlView?.let {
            containerView.removeView(it)
            parent?.addView(it, generateDefaultLayoutParams())
        }
        parent?.requestLayout()
        parent = null
        onBackPressedCallback.handleOnBackPressed()
        restoreSystemUI()
    }

    // restore system UI state
    private fun restoreSystemUI() {
        window?.let {
            updateNavigationBarVisibility(
                it,
                initialNavigationBarIsVisible,
                initialNotificationBarIsVisible,
                initialSystemBarsBehavior
            )
        }
    }

    fun hideWithoutPlayer() {
        for (i in 0 until containerView.childCount) {
            if (containerView.getChildAt(i) !== exoPlayerView) {
                containerView.getChildAt(i).visibility = View.GONE
            }
        }
    }

    private fun getFullscreenIconResource(isFullscreen: Boolean): Int =
        if (isFullscreen) {
            androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit
        } else {
            androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter
        }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (reactExoplayerView.preventsDisplaySleepDuringVideoPlayback) {
            mKeepScreenOnHandler.post(mKeepScreenOnUpdater)
        }
    }

    private fun generateDefaultLayoutParams(): FrameLayout.LayoutParams {
        val layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        layoutParams.setMargins(0, 0, 0, 0)
        return layoutParams
    }

    private fun updateBarVisibility(
        inset: WindowInsetsControllerCompat,
        type: Int,
        shouldHide: Boolean?,
        initialVisibility: Boolean?,
        systemBarsBehavior: Int? = null
    ) {
        shouldHide?.takeIf { it != initialVisibility }?.let {
            if (it) {
                inset.hide(type)
                systemBarsBehavior?.let { behavior -> inset.systemBarsBehavior = behavior }
            } else {
                inset.show(type)
            }
        }
    }

    // Move the UI to fullscreen.
    // if you change this code, remember to check that the UI is well restored in restoreUIState
    private fun updateNavigationBarVisibility(
        window: Window,
        hideNavigationBarOnFullScreenMode: Boolean?,
        hideNotificationBarOnFullScreenMode: Boolean?,
        systemBarsBehavior: Int?
    ) {
        // Configure the behavior of the hidden system bars.
        val inset = WindowInsetsControllerCompat(window, window.decorView)

        // Update navigation bar visibility and apply systemBarsBehavior if hiding
        updateBarVisibility(
            inset,
            WindowInsetsCompat.Type.navigationBars(),
            hideNavigationBarOnFullScreenMode,
            initialNavigationBarIsVisible,
            systemBarsBehavior
        )

        // Update notification bar visibility (no need for systemBarsBehavior here)
        updateBarVisibility(
            inset,
            WindowInsetsCompat.Type.statusBars(),
            hideNotificationBarOnFullScreenMode,
            initialNotificationBarIsVisible
        )
    }

    private fun updateNavigationBarVisibility() {
        window?.let {
            updateNavigationBarVisibility(
                it,
                controlsConfig.hideNavigationBarOnFullScreenMode,
                controlsConfig.hideNotificationBarOnFullScreenMode,
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            )
        }
        // Note: Live container adjustment is no longer needed since we're using PlayerView's built-in controls
        // PlayerView handles UI adjustments automatically
    }
}
