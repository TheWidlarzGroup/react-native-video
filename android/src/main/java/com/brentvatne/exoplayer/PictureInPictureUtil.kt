package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.graphics.Rect
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Process
import android.util.Rational
import androidx.activity.ComponentActivity
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.annotation.RequiresApi
import androidx.core.app.AppOpsManagerCompat
import androidx.core.app.PictureInPictureModeChangedInfo
import androidx.core.util.Consumer
import androidx.lifecycle.Lifecycle
import androidx.media3.exoplayer.ExoPlayer
import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.receiver.PictureInPictureReceiver
import com.facebook.react.uimanager.ThemedReactContext

internal fun Context.findActivity(): ComponentActivity {
    var context = this
    while (context is ContextWrapper) {
        if (context is ComponentActivity) return context
        context = context.baseContext
    }
    throw IllegalStateException("Picture in picture should be called in the context of an Activity")
}

object PictureInPictureUtil {
    private const val FLAG_SUPPORTS_PICTURE_IN_PICTURE = 0x400000
    private const val TAG = "PictureInPictureUtil"

    @JvmStatic
    fun addLifecycleEventListener(context: ThemedReactContext, view: ReactExoplayerView): Runnable {
        val activity = context.findActivity()

        val onPictureInPictureModeChanged = Consumer<PictureInPictureModeChangedInfo> { info ->
            view.setIsInPictureInPicture(info.isInPictureInPictureMode)
            if (!info.isInPictureInPictureMode && activity.lifecycle.currentState == Lifecycle.State.CREATED) {
                // when user click close button of PIP
                if (!view.playInBackground) view.setPausedModifier(true)
            }
        }

        val onUserLeaveHintCallback = Runnable {
            if (view.enterPictureInPictureOnLeave) {
                view.enterPictureInPictureMode()
            }
        }

        activity.addOnPictureInPictureModeChangedListener(onPictureInPictureModeChanged)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            activity.addOnUserLeaveHintListener(onUserLeaveHintCallback)
        }

        // @TODO convert to lambda when ReactExoplayerView migrated
        return Runnable {
            with(activity) {
                removeOnPictureInPictureModeChangedListener(onPictureInPictureModeChanged)
                removeOnUserLeaveHintListener(onUserLeaveHintCallback)
            }
        }
    }

    @JvmStatic
    fun enterPictureInPictureMode(context: ThemedReactContext, pictureInPictureParams: PictureInPictureParams?) {
        if (!isSupportPictureInPicture(context)) return
        if (isSupportPictureInPictureAction() && pictureInPictureParams != null) {
            try {
                context.findActivity().enterPictureInPictureMode(pictureInPictureParams)
            } catch (e: IllegalStateException) {
                DebugLog.e(TAG, e.toString())
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                @Suppress("DEPRECATION")
                context.findActivity().enterPictureInPictureMode()
            } catch (e: IllegalStateException) {
                DebugLog.e(TAG, e.toString())
            }
        }
    }

    @JvmStatic
    fun applyPlayingStatus(
        context: ThemedReactContext,
        pipParamsBuilder: PictureInPictureParams.Builder?,
        receiver: PictureInPictureReceiver,
        isPaused: Boolean
    ) {
        if (pipParamsBuilder == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val actions = getPictureInPictureActions(context, isPaused, receiver)
        pipParamsBuilder.setActions(actions)
        updatePictureInPictureActions(context, pipParamsBuilder.build())
    }

    @JvmStatic
    fun applyAutoEnterEnabled(context: ThemedReactContext, pipParamsBuilder: PictureInPictureParams.Builder?, autoEnterEnabled: Boolean) {
        if (pipParamsBuilder == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        pipParamsBuilder.setAutoEnterEnabled(autoEnterEnabled)
        updatePictureInPictureActions(context, pipParamsBuilder.build())
    }

    @JvmStatic
    fun applySourceRectHint(context: ThemedReactContext, pipParamsBuilder: PictureInPictureParams.Builder?, playerView: ExoPlayerView) {
        if (pipParamsBuilder == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        pipParamsBuilder.setSourceRectHint(calcRectHint(playerView))
        updatePictureInPictureActions(context, pipParamsBuilder.build())
    }

    private fun updatePictureInPictureActions(context: ThemedReactContext, pipParams: PictureInPictureParams) {
        if (!isSupportPictureInPictureAction()) return
        if (!isSupportPictureInPicture(context)) return
        try {
            context.findActivity().setPictureInPictureParams(pipParams)
        } catch (e: IllegalStateException) {
            DebugLog.e(TAG, e.toString())
        }
    }

    @JvmStatic
    @RequiresApi(Build.VERSION_CODES.O)
    fun getPictureInPictureActions(context: ThemedReactContext, isPaused: Boolean, receiver: PictureInPictureReceiver): ArrayList<RemoteAction> {
        val intent = receiver.getPipActionIntent(isPaused)
        val resource =
            if (isPaused) androidx.media3.ui.R.drawable.exo_icon_play else androidx.media3.ui.R.drawable.exo_icon_pause
        val icon = Icon.createWithResource(context, resource)
        val title = if (isPaused) "play" else "pause"
        return arrayListOf(RemoteAction(icon, title, title, intent))
    }

    @JvmStatic
    @RequiresApi(Build.VERSION_CODES.O)
    private fun calcRectHint(playerView: ExoPlayerView): Rect {
        val hint = Rect()
        // Use the PlayerView itself since surfaceView is private
        playerView.getGlobalVisibleRect(hint)
        val location = IntArray(2)
        playerView.getLocationOnScreen(location)

        val height = hint.bottom - hint.top
        hint.top = location[1]
        hint.bottom = hint.top + height
        return hint
    }

    @JvmStatic
    @RequiresApi(Build.VERSION_CODES.O)
    fun calcPictureInPictureAspectRatio(player: ExoPlayer): Rational {
        var aspectRatio = Rational(player.videoSize.width, player.videoSize.height)
        // AspectRatio for the activity in picture-in-picture, must be between 2.39:1 and 1:2.39 (inclusive).
        // https://developer.android.com/reference/android/app/PictureInPictureParams.Builder#setAspectRatio(android.util.Rational)
        val maximumRatio = Rational(239, 100)
        val minimumRatio = Rational(100, 239)
        if (aspectRatio.toFloat() > maximumRatio.toFloat()) {
            aspectRatio = maximumRatio
        } else if (aspectRatio.toFloat() < minimumRatio.toFloat()) {
            aspectRatio = minimumRatio
        }
        return aspectRatio
    }

    private fun isSupportPictureInPicture(context: ThemedReactContext): Boolean =
        checkIsApiSupport() && checkIsSystemSupportPIP(context) && checkIsUserAllowPIP(context)

    private fun isSupportPictureInPictureAction(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O

    @ChecksSdkIntAtLeast(api = Build.VERSION_CODES.N)
    private fun checkIsApiSupport(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N

    @RequiresApi(Build.VERSION_CODES.N)
    private fun checkIsSystemSupportPIP(context: ThemedReactContext): Boolean {
        val activity = context.findActivity() ?: return false

        val activityInfo = activity.packageManager.getActivityInfo(activity.componentName, PackageManager.GET_META_DATA)
        // detect current activity's android:supportsPictureInPicture value defined within AndroidManifest.xml
        // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/content/pm/ActivityInfo.java;l=1090-1093;drc=7651f0a4c059a98f32b0ba30cd64500bf135385f
        val isActivitySupportPip = activityInfo.flags and FLAG_SUPPORTS_PICTURE_IN_PICTURE != 0

        // PIP might be disabled on devices that have low RAM.
        val isPipAvailable = activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

        return isActivitySupportPip && isPipAvailable
    }

    private fun checkIsUserAllowPIP(context: ThemedReactContext): Boolean {
        val activity = context.currentActivity ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            @SuppressLint("InlinedApi")
            val result = AppOpsManagerCompat.noteOpNoThrow(
                activity,
                AppOpsManager.OPSTR_PICTURE_IN_PICTURE,
                Process.myUid(),
                activity.packageName
            )
            AppOpsManager.MODE_ALLOWED == result
        } else {
            Build.VERSION.SDK_INT < Build.VERSION_CODES.O && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        }
    }
}
