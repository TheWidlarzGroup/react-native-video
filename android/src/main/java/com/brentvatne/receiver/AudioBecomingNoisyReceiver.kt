package com.brentvatne.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import androidx.core.content.ContextCompat

class AudioBecomingNoisyReceiver(private val context: Context) : BroadcastReceiver() {
    private var listener: BecomingNoisyListener = BecomingNoisyListener.NO_OP
    private val appContext: Context = context.applicationContext

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY == intent.action) {
            listener.onAudioBecomingNoisy()
        }
    }

    fun setListener(listener: BecomingNoisyListener) {
        this.listener = listener
        val intentFilter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        try {
            ContextCompat.registerReceiver(appContext, this, intentFilter, ContextCompat.RECEIVER_NOT_EXPORTED)
        } catch (e: Exception) {
            // Handle the exception and log it, but do not crash the app
            e.printStackTrace()
        }
    }

    fun removeListener() {
        this.listener = BecomingNoisyListener.NO_OP
        try {
            appContext.unregisterReceiver(this)
        } catch (ignore: Exception) {
            // ignore if already unregistered
        }
    }
}

interface BecomingNoisyListener {
    fun onAudioBecomingNoisy()

    companion object {
        val NO_OP: BecomingNoisyListener = object : BecomingNoisyListener {
            override fun onAudioBecomingNoisy() {
                // No operation
            }
        }
    }
}
