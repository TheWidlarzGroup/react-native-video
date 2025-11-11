package com.twg.video.core.utils

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.util.Rational
import android.view.View
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.NitroModules
import com.twg.video.view.VideoView

@OptIn(UnstableApi::class)
object PictureInPictureUtils {
  private const val TAG = "PictureInPictureUtils"

  fun canEnterPictureInPicture(): Boolean {
    val applicationContent = NitroModules.applicationContext
    val currentActivity = applicationContent?.currentActivity
    return currentActivity?.packageManager?.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE) == true
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun createPictureInPictureParams(videoView: VideoView): PictureInPictureParams {
    val builder = PictureInPictureParams.Builder()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && videoView.autoEnterPictureInPicture) {
      builder.setAutoEnterEnabled(videoView.autoEnterPictureInPicture)
    }

    return builder
      .setAspectRatio(calculateAspectRatio(videoView.playerView))
      .setSourceRectHint(calculateSourceRectHint(videoView.playerView))
      .build()
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun createDisabledPictureInPictureParams(videoView: VideoView): PictureInPictureParams {
    val defaultParams = PictureInPictureParams.Builder()
      .setAspectRatio(null) // Clear aspect ratio
      .setSourceRectHint(null) // Clear source rect hint

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      defaultParams.setAutoEnterEnabled(false)
    }

    return defaultParams.build()
  }

  fun calculateAspectRatio(view: View): Rational {
    // AspectRatio for PIP must be between 2.39:1 and 1:2.39
    // see: https://developer.android.com/reference/android/app/PictureInPictureParams.Builder#setAspectRatio(android.util.Rational)

    val maximumAspectRatio = Rational(239, 100)
    val minimumAspectRatio = Rational(100, 239)

    val currentAspectRatio = Rational(view.width, view.height)

    return when {
      currentAspectRatio > maximumAspectRatio -> maximumAspectRatio
      currentAspectRatio < minimumAspectRatio -> minimumAspectRatio
      else -> currentAspectRatio
    }
  }

  fun calculateSourceRectHint(view: View): Rect {
    // Get the visible rectangle of view in screen coordinates
    val visibleRect = Rect()
    view.getGlobalVisibleRect(visibleRect)

    // Get the Y position of view on the screen
    val locationOnScreen = IntArray(2)
    view.getLocationOnScreen(locationOnScreen)
    val yOnScreen = locationOnScreen[1]

    // Preserve the original height
    val height = visibleRect.height()

    // Set the new top and bottom based on the view's screen position
    visibleRect.top = yOnScreen
    visibleRect.bottom = yOnScreen + height

    return visibleRect
  }

  fun safeSetPictureInPictureParams(params: PictureInPictureParams) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val currentActivity = NitroModules.applicationContext?.currentActivity
        currentActivity?.setPictureInPictureParams(params)
        Log.d(TAG, "Successfully set PiP params")
      } catch (e: Exception) {
        Log.w(TAG, "Failed to set PiP params - PiP may not be enabled in manifest", e)
        // Ignore: We cannot check if user has added support for PIP in manifest
        // so we need to catch error if he did not add it.
      }
    }
  }
  
  @RequiresApi(Build.VERSION_CODES.O)
  fun safeEnterPictureInPictureMode(params: PictureInPictureParams): Boolean {
    return try {
      val currentActivity = NitroModules.applicationContext?.currentActivity
      val result = currentActivity?.enterPictureInPictureMode(params) ?: false
      Log.d(TAG, "PiP enter result: $result")
      result
    } catch (e: Exception) {
      Log.e(TAG, "Failed to enter PiP mode", e)
      false
    }
  }
  
  fun isCurrentlyInPictureInPictureMode(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val currentActivity = NitroModules.applicationContext?.currentActivity
        currentActivity?.isInPictureInPictureMode == true
      } catch (e: Exception) {
        Log.w(TAG, "Failed to check PiP mode status", e)
        false
      }
    } else {
      false
    }
  }
}
