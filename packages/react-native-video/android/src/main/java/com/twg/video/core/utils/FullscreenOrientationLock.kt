package com.twg.video.core.utils

import android.app.Activity
import android.content.pm.ActivityInfo
import android.provider.Settings
import android.view.OrientationEventListener
import com.margelo.nitro.video.FullscreenOrientation

/**
 * Holds the activity in the orientation requested for fullscreen and gives it back on release.
 *
 * With autorotate the orientation is held until the user has turned the device to it. After that
 * fullscreen follows the device, also in an activity locked to one orientation, and the activity
 * gets its own setting back on release.
 */
class FullscreenOrientationLock(private val activity: Activity) {
  private var orientationBefore: Int? = null
  private var listener: OrientationEventListener? = null

  fun apply(orientation: FullscreenOrientation, autorotate: Boolean) {
    val requested = when (orientation) {
      FullscreenOrientation.LANDSCAPE -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
      FullscreenOrientation.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      FullscreenOrientation.ALL -> null
    }
    if (requested == null) {
      release()
      return
    }

    if (orientationBefore == null) {
      orientationBefore = activity.requestedOrientation
    }
    activity.requestedOrientation = requested

    stopListening()
    if (autorotate) {
      startListening(orientation)
    }
  }

  fun release() {
    stopListening()
    orientationBefore?.let { activity.requestedOrientation = it }
    orientationBefore = null
  }

  private fun startListening(orientation: FullscreenOrientation) {
    val newListener = object : OrientationEventListener(activity) {
      override fun onOrientationChanged(degrees: Int) {
        if (degrees == ORIENTATION_UNKNOWN || !deviceMatches(orientation, degrees)) return
        // With rotation locked in the system settings the device does not follow the user,
        // so giving the orientation back would turn fullscreen away from what was requested.
        if (!isSystemAutoRotateOn()) return

        stopListening()
        // Not the activity's own setting: an activity locked to portrait would turn fullscreen
        // back to portrait while the device is held in landscape.
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_USER
      }
    }
    if (newListener.canDetectOrientation()) {
      newListener.enable()
      listener = newListener
    }
  }

  private fun stopListening() {
    listener?.disable()
    listener = null
  }

  private fun deviceMatches(orientation: FullscreenOrientation, degrees: Int): Boolean {
    return when (orientation) {
      FullscreenOrientation.LANDSCAPE ->
        degrees in (90 - TOLERANCE)..(90 + TOLERANCE) || degrees in (270 - TOLERANCE)..(270 + TOLERANCE)
      FullscreenOrientation.PORTRAIT -> degrees <= TOLERANCE || degrees >= 360 - TOLERANCE
      FullscreenOrientation.ALL -> true
    }
  }

  private fun isSystemAutoRotateOn(): Boolean {
    return Settings.System.getInt(activity.contentResolver, Settings.System.ACCELEROMETER_ROTATION, 0) == 1
  }

  private companion object {
    const val TOLERANCE = 30
  }
}
