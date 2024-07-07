package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.activity.OnBackPressedCallback
import androidx.media3.ui.LegacyPlayerControlView
import com.brentvatne.common.toolbox.DebugLog
import java.lang.ref.WeakReference

@SuppressLint("PrivateResource")
class FullScreenPlayerView(
    context: Context,
    private val exoPlayerView: ExoPlayerView,
    private val reactExoplayerView: ReactExoplayerView,
    private val playerControlView: LegacyPlayerControlView?,
    private val onBackPressedCallback: OnBackPressedCallback
) : Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

    private var parent: ViewGroup? = null
    private val containerView = FrameLayout(context)
    private val mKeepScreenOnHandler = Handler(Looper.getMainLooper())
    private val mKeepScreenOnUpdater = KeepScreenOnUpdater(this)

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
    }
    override fun onBackPressed() {
        super.onBackPressed()
        onBackPressedCallback.handleOnBackPressed()
    }

    override fun onStart() {
        super.onStart()
        parent = exoPlayerView.parent as ViewGroup?
        parent?.removeView(exoPlayerView)
        containerView.addView(exoPlayerView, generateDefaultLayoutParams())
        playerControlView?.let {
            updateFullscreenButton(playerControlView, true)
            parent?.removeView(it)
            containerView.addView(it, generateDefaultLayoutParams())
        }
    }

    override fun onStop() {
        super.onStop()
        mKeepScreenOnHandler.removeCallbacks(mKeepScreenOnUpdater)
        containerView.removeView(exoPlayerView)
        parent?.addView(exoPlayerView, generateDefaultLayoutParams())
        playerControlView?.let {
            updateFullscreenButton(playerControlView, false)
            containerView.removeView(it)
            parent?.addView(it, generateDefaultLayoutParams())
        }
        parent?.requestLayout()
        parent = null
    }

    private fun getFullscreenIconResource(isFullscreen: Boolean): Int {
        return if (isFullscreen) {
            androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit
        } else {
            androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter
        }
    }

    private fun updateFullscreenButton(playerControlView: LegacyPlayerControlView, isFullscreen: Boolean) {
        val imageButton = playerControlView.findViewById<ImageButton?>(com.brentvatne.react.R.id.exo_fullscreen)
        imageButton?.let {
            val imgResource = getFullscreenIconResource(isFullscreen)
            val desc = if (isFullscreen) {
                context.getString(androidx.media3.ui.R.string.exo_controls_fullscreen_exit_description)
            } else {
                context.getString(androidx.media3.ui.R.string.exo_controls_fullscreen_enter_description)
            }
            imageButton.setImageResource(imgResource)
            imageButton.contentDescription = desc
        }
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
}
