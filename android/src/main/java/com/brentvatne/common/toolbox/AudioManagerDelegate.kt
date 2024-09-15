package com.brentvatne.common.toolbox

import android.content.Context
import android.media.AudioManager
import android.media.AudioManager.OnAudioFocusChangeListener
import com.brentvatne.common.api.RNVPlayerInterface
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Delegate audio management to this class
 * This is an helper to group all generic android code which do not depend on player implementation
 */
class AudioManagerDelegate(player: RNVPlayerInterface, themedReactContext: ThemedReactContext) {

    companion object {
        const val TAG = "AudioFocusDelegate"
    }

    // indicates if audio focus shall be handled
    var disableFocus: Boolean = false

    // indicates app currently have audio focus
    var hasAudioFocus = false

    val audioManager: AudioManager = themedReactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val audioFocusChangeListener = OnAudioFocusChangedListener(player, themedReactContext, this)

    /** implementation of OnAudioFocusChangedListener
     * It reports audio events to the app and request volume change to the player
     **/
    private class OnAudioFocusChangedListener(
        private val player: RNVPlayerInterface,
        private val themedReactContext: ThemedReactContext,
        private val audioFocusDelegate: AudioManagerDelegate
    ) : OnAudioFocusChangeListener {
        override fun onAudioFocusChange(focusChange: Int) {
            when (focusChange) {
                AudioManager.AUDIOFOCUS_LOSS -> {
                    audioFocusDelegate.hasAudioFocus = false
                    player.eventEmitter.onAudioFocusChanged.invoke(false)
                    // FIXME this pause can cause issue if content doesn't have pause capability (can happen on live channel)
                    themedReactContext.currentActivity?.runOnUiThread(player::pausePlayback)
                    audioFocusDelegate.audioManager.abandonAudioFocus(this)
                }

                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> player.eventEmitter.onAudioFocusChanged.invoke(false)

                AudioManager.AUDIOFOCUS_GAIN -> {
                    audioFocusDelegate.hasAudioFocus = true
                    player.eventEmitter.onAudioFocusChanged.invoke(true)
                }

                else -> {
                    DebugLog.e(TAG, "unhandled audioFocusChange $focusChange")
                }
            }
            if (player.isPlaying) {
                if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                    // Lower the volume
                    if (!player.isMuted) {
                        player.audioDuck()
                    }
                } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                    // Raise it back to normal
                    if (!player.isMuted) {
                        player.audioRestoreFromDuck()
                    }
                }
            }
        }
    }

    /**
     * request audio Focus
     */
    fun requestAudioFocus(): Boolean {
        if (disableFocus || hasAudioFocus) {
            return true
        }
        val result: Int = audioManager.requestAudioFocus(
            audioFocusChangeListener,
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN
        )
        hasAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        return hasAudioFocus
    }

    /**
     * Abandon audio Focus
     */
    fun abandonAudioFocus() {
        audioManager.abandonAudioFocus(audioFocusChangeListener)
    }

    /**
     * change system audio output
     */
    fun changeOutput(isSpeakerOutput: Boolean) {
        audioManager.setMode(
            if (isSpeakerOutput) AudioManager.MODE_NORMAL else AudioManager.MODE_IN_COMMUNICATION
        )
        audioManager.setSpeakerphoneOn(isSpeakerOutput)
    }
}
