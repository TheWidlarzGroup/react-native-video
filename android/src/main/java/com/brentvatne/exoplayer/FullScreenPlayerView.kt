package com.brentvatne.exoplayer

import android.app.Dialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.ui.LegacyPlayerControlView
import com.brentvatne.common.api.ControlsConfig
import com.brentvatne.common.toolbox.DebugLog
import java.lang.ref.WeakReference

class FullScreenPlayerView(
    context: Context,
    private val exoPlayerView: ExoPlayerView,
    private val reactExoplayerView: ReactExoplayerView,
    private val onBackPressedCallback: OnBackPressedCallback,
    private val controlsConfig: ControlsConfig
) : Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

    private var parent: ViewGroup? = null
    private val containerView = FrameLayout(context)
    private val mKeepScreenOnHandler: Handler = Handler(Looper.getMainLooper())
    private val mKeepScreenOnUpdater: Runnable = KeepScreenOnUpdater(this)

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
                fullscreenVideoPlayer?.let {
                    val window = it.window
                    if (window != null) {
                        val isPlaying = it.exoPlayerView.isPlaying
                        when {
                            isPlaying -> window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                            else -> window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        }
                    }
                    it.mKeepScreenOnHandler.postDelayed(this, UPDATE_KEEP_SCREEN_ON_FLAG_MS)
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

    override fun onBackPressed() {
        findViewById<ImageView>(androidx.media3.ui.R.id.exo_fullscreen)?.performClick()
        super.onBackPressed()
    }

    override fun onStart() {
        super.onStart()
        parent = exoPlayerView.parent as ViewGroup?
        parent?.removeView(exoPlayerView)
        containerView.addView(exoPlayerView, generateDefaultLayoutParams())
        updateNavigationBarVisibility()
    }

    override fun onStop() {
        super.onStop()
        onBackPressedCallback.handleOnBackPressed()
        mKeepScreenOnHandler.removeCallbacks(mKeepScreenOnUpdater)
        containerView.removeView(exoPlayerView)
        parent?.addView(exoPlayerView, generateDefaultLayoutParams())
        parent?.requestLayout()
        parent = null
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

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (reactExoplayerView.preventsDisplaySleepDuringVideoPlayback) {
            mKeepScreenOnHandler.post(mKeepScreenOnUpdater)
        }
    }

    private fun generateDefaultLayoutParams(): FrameLayout.LayoutParams =
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ).apply {
            setMargins(0, 0, 0, 0)
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
    }
}
