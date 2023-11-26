package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.pm.PackageManager
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Process
import androidx.annotation.RequiresApi
import androidx.core.app.AppOpsManagerCompat
import com.brentvatne.receiver.PictureInPictureReceiver
import com.facebook.react.uimanager.ThemedReactContext


class PictureInPictureUtil {
    companion object {
        fun enterPictureInPictureMode(context: ThemedReactContext, pictureInPictureParams: PictureInPictureParams?) {
            if (!isSupportPictureInPicture(context)) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && pictureInPictureParams != null) {
                context.currentActivity?.let{ it.enterPictureInPictureMode(pictureInPictureParams) }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                context.currentActivity?.let{ it.enterPictureInPictureMode() }
            }
        }

        fun updatePictureInPictureActions(context: ThemedReactContext, pictureInPictureParams: PictureInPictureParams) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.currentActivity?.let{ it.setPictureInPictureParams(pictureInPictureParams) }
            }
        }

        @RequiresApi(Build.VERSION_CODES.O)
        fun getPictureInPictureActions(
            context: ThemedReactContext,
            isPaused: Boolean,
            receiver: PictureInPictureReceiver
        ): ArrayList<RemoteAction> {
            val intent = receiver.getPipActionIntent(isPaused)
            val resource =
                if (isPaused) androidx.media3.ui.R.drawable.exo_icon_play else androidx.media3.ui.R.drawable.exo_icon_pause
            val icon = Icon.createWithResource(context, resource)
            val title = if (isPaused) "play" else "pause"
            return arrayListOf(RemoteAction(icon, title, title, intent))
        }

        private fun isSupportPictureInPicture(context: ThemedReactContext): Boolean {
            return checkIsApiSupport() && checkIsUserAllowPIP(context) && checkIsSystemSupportPIP(context)
        }

        private fun checkIsApiSupport(): Boolean {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        }

        private fun checkIsUserAllowPIP(context: ThemedReactContext): Boolean {
            val activity = context.currentActivity ?: return false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                @SuppressLint("InlinedApi") val result = AppOpsManagerCompat.noteOpNoThrow(
                    activity,
                    AppOpsManager.OPSTR_PICTURE_IN_PICTURE,
                    Process.myUid(),
                    activity.packageName
                )
                // In Android 10 Google Pixel, If allow,MODE_ALLOWED. If not allow, MODE_ERRORED
                // Log.d(TAG, "isSupportPIP: OPSTR_PICTURE_IN_PICTURE=" + result); // MODE_ERRORED
                return AppOpsManager.MODE_ALLOWED == result
            } else {
                return Build.VERSION.SDK_INT < Build.VERSION_CODES.O && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
            }
        }

        // PIP might be disabled on devices that have low RAM.
        private fun checkIsSystemSupportPIP(context: ThemedReactContext): Boolean {
            val activity = context.currentActivity ?: return false
            return activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
        }
    }
}
