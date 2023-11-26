package com.brentvatne.exoplayer

import android.view.View
import androidx.fragment.app.Fragment

class ReactExoplayerFragment constructor(private val view: ReactExoplayerView) : Fragment() {

    private val TAG = "ReactExoplayerFragment"

    private var mIsOnStopCalled = false
    private var mStoredUiOptions = View.SYSTEM_UI_FLAG_VISIBLE

    override fun onStart() {
        super.onStart()
        mIsOnStopCalled = false
    }

    override fun onStop() {
        // On entering Picture-in-Picture mode, onPause is called, but not onStop.
        // For this reason, this is the place where we should pause the video playback.
        super.onStop()
        if (!view.playInBackground) view.setPausedModifier(true)
        mIsOnStopCalled = true
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode)
        view.setIsInPictureInPicture(isInPictureInPictureMode)
        hideSystemUI(isInPictureInPictureMode)
        // To pause player when closing PIP window.
        if (!isInPictureInPictureMode && mIsOnStopCalled && !view.playInBackground) {
            view.setPausedModifier(true)
        }
    }

    private fun hideSystemUI(hideSystemUI: Boolean) {
        val activity = activity ?: return
        val decorView = activity.window.decorView
        val uiOptions: Int
        if (hideSystemUI) {
            mStoredUiOptions = decorView.systemUiVisibility
            uiOptions = (View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
        } else {
            uiOptions = mStoredUiOptions
        }
        decorView.systemUiVisibility = uiOptions
    }
}
