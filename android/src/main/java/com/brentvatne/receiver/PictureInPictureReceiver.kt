package com.brentvatne.receiver

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.brentvatne.exoplayer.ReactExoplayerView
import com.facebook.react.uimanager.ThemedReactContext


class PictureInPictureReceiver(private val view: ReactExoplayerView, private val context: ThemedReactContext): BroadcastReceiver() {

    companion object {
        val ACTION_MEDIA_CONTROL = "rnv_media_control"
        val EXTRA_CONTROL_TYPE = "rnv_control_type"
        // The request code for play action PendingIntent.
        val REQUEST_PLAY = 1
        // The request code for pause action PendingIntent.
        val REQUEST_PAUSE = 2
        // The intent extra value for play action.
        val CONTROL_TYPE_PLAY = 1
        // The intent extra value for pause action.
        val CONTROL_TYPE_PAUSE = 2
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        intent ?: return
        if (intent.action == ACTION_MEDIA_CONTROL) {
            val controlType = intent.getIntExtra(EXTRA_CONTROL_TYPE, 0)
            when (controlType) {
                 CONTROL_TYPE_PLAY -> view.setPausedModifier(false)
                 CONTROL_TYPE_PAUSE -> view.setPausedModifier(true)
            }
        }
    }

    fun setListener() {
        context.currentActivity?.registerReceiver(this, IntentFilter(ACTION_MEDIA_CONTROL))
    }

    fun removeListener() {
        try {
            context.currentActivity?.unregisterReceiver(this)
        } catch (e: Exception) {
            // ignore if already unregistered
        }
    }

    fun getPipActionIntent(isPaused: Boolean): PendingIntent {
        val requestCode = if (isPaused) REQUEST_PLAY else REQUEST_PAUSE
        val controlType = if (isPaused) CONTROL_TYPE_PLAY else CONTROL_TYPE_PAUSE
        val flag =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
        val intent = Intent(ACTION_MEDIA_CONTROL).putExtra(
            EXTRA_CONTROL_TYPE, controlType)
        return PendingIntent.getBroadcast(context, requestCode, intent, flag)
    }
}
