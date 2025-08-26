package com.twg.video.core.recivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import androidx.core.content.ContextCompat
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayerEventEmitterSpec
import com.twg.video.core.LibraryError

class AudioBecomingNoisyReceiver() : BroadcastReceiver() {
  private var eventEmitter: HybridVideoPlayerEventEmitterSpec? = null

  override fun onReceive(context: Context?, intent: Intent?) {
    if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
      eventEmitter?.onAudioBecomingNoisy?.invoke()
    }
  }

  fun setEventEmitter(eventEmitter: HybridVideoPlayerEventEmitterSpec) {
    val context = NitroModules.applicationContext ?: throw LibraryError.ApplicationContextNotFound

    this.eventEmitter = eventEmitter
    val intentFilter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
    ContextCompat.registerReceiver(
      context.applicationContext,
      this,
      intentFilter,
      ContextCompat.RECEIVER_NOT_EXPORTED
    )
  }

  fun removeEventEmitter() {
    this.eventEmitter = null
  }
}
