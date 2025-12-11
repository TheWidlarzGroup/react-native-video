package com.twg.video.core.player

import android.media.AudioManager
import com.margelo.nitro.video.HybridVideoPlayerEventEmitter

// TODO: We should make VideoFocusManager that will track focus globally for now lets just do simple listener
class OnAudioFocusChangedListener : AudioManager.OnAudioFocusChangeListener {
  private var eventEmitter: HybridVideoPlayerEventEmitter? = null

  override fun onAudioFocusChange(focusChange: Int) {
    when (focusChange) {
      AudioManager.AUDIOFOCUS_GAIN -> eventEmitter?.onAudioFocusChange(true)
      AudioManager.AUDIOFOCUS_LOSS -> eventEmitter?.onAudioFocusChange(false)
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> eventEmitter?.onAudioFocusChange(false)
    }
  }

  fun setEventEmitter(eventEmitter: HybridVideoPlayerEventEmitter) {
    this.eventEmitter = eventEmitter
  }

  fun removeEventEmitter() {
    this.eventEmitter = null
  }
}
