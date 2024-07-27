package com.brentvatne.exoplayer

import android.app.Dialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import com.brentvatne.common.toolbox.DebugLog
import java.lang.ref.WeakReference

class FullScreenPlayerView(
    context: Context,
    private val exoPlayerView: ExoPlayerView,
    private val reactExoplayerView: ReactExoplayerView,
    private val onBackPressedCallback: OnBackPressedCallback
) : Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

    private var parent: ViewGroup? = null
    private val containerView = FrameLayout(context)
    private val mKeepScreenOnHandler: Handler = Handler(Looper.getMainLooper())
    private val mKeepScreenOnUpdater: Runnable = KeepScreenOnUpdater(this)

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
    }

    override fun onBackPressed() {
        findViewById<ImageView>(androidx.media3.ui.R.id.exo_fullscreen)?.performClick()
        onBackPressedCallback.handleOnBackPressed()
        super.onBackPressed()
    }

    override fun onStart() {
        super.onStart()
        parent = exoPlayerView.parent as ViewGroup?
        parent?.removeView(exoPlayerView)
        containerView.addView(exoPlayerView, generateDefaultLayoutParams())
    }

    override fun onStop() {
        super.onStop()
        mKeepScreenOnHandler.removeCallbacks(mKeepScreenOnUpdater)
        containerView.removeView(exoPlayerView)
        parent?.addView(exoPlayerView, generateDefaultLayoutParams())
        parent?.requestLayout()
        parent = null
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
}
