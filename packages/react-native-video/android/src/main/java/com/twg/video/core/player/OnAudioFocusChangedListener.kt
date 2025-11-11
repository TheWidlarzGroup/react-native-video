package com.twg.video.core.player

import android.content.IntentFilter
import android.media.AudioManager
import androidx.core.content.ContextCompat
import com.margelo.nitro.video.HybridVideoPlayerEventEmitterSpec

// TODO: We should make VideoFocusManager that will track focus globally for now lets just do simple listener
class OnAudioFocusChangedListener : AudioManager.OnAudioFocusChangeListener {
  private var eventEmitter: HybridVideoPlayerEventEmitterSpec? = null

  override fun onAudioFocusChange(focusChange: Int) {
    when (focusChange) {
      AudioManager.AUDIOFOCUS_GAIN -> eventEmitter?.onAudioFocusChange?.invoke(true)
      AudioManager.AUDIOFOCUS_LOSS -> eventEmitter?.onAudioFocusChange?.invoke(false)
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> eventEmitter?.onAudioFocusChange?.invoke(false)
    }
  }

  fun setEventEmitter(eventEmitter: HybridVideoPlayerEventEmitterSpec) {
    this.eventEmitter = eventEmitter
  }

  fun removeEventEmitter() {
    this.eventEmitter = null
  }
}
