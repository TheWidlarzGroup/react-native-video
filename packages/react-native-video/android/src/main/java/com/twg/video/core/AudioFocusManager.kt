package com.twg.video.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.AudioFocusRequest
import android.os.Build
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.AudioOutput
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.MixAudioMode
import com.twg.video.core.utils.Threading
import kotlin.getValue

@OptIn(UnstableApi::class)
class AudioFocusManager() {
  private val players = mutableListOf<HybridVideoPlayer>()
  private var currentMixAudioMode: MixAudioMode? = null
  private var audioFocusRequest: AudioFocusRequest? = null
  private var isEarpieceModeActive = false

  val appContext by lazy {
    NitroModules.applicationContext ?: throw UnknownError()
  }

  private val audioManager by lazy {
    appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: throw UnknownError()
  }

  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    Threading.runOnMainThread {
      when (focusChange) {
        AudioManager.AUDIOFOCUS_GAIN -> {
          unDuckActivePlayers()
        }
        AudioManager.AUDIOFOCUS_LOSS -> {
          pauseActivePlayers()
          currentMixAudioMode = null
          audioFocusRequest = null
        }
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
          val mixAudioMode = determineRequiredMixMode()
          if (mixAudioMode != MixAudioMode.MIXWITHOTHERS) {
            pauseActivePlayers()
            currentMixAudioMode = null
            audioFocusRequest = null
          }
        }
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
          val mixAudioMode = determineRequiredMixMode()
          when (mixAudioMode) {
            MixAudioMode.DONOTMIX -> pauseActivePlayers()
            else -> duckActivePlayers()
          }
        }
      }
    }
  }

  fun registerPlayer(player: HybridVideoPlayer) = Threading.runOnMainThread {
    if (player.isReleaseStarted) {
      return@runOnMainThread
    }
    if (!players.contains(player)) {
      players.add(player)
    }
    requestAudioOutputUpdate()
  }

  fun unregisterPlayer(player: HybridVideoPlayer) = Threading.runOnMainThread {
    players.remove(player)
    requestAudioOutputUpdate()
    if (players.isEmpty()) {
      abandonAudioFocus()
    } else {
      requestAudioFocusUpdate()
    }
  }

  /**
   * A player with audioOutput 'earpiece' uses voice-communication audio attributes, which most
   * devices route to the earpiece. Some only do that in MODE_IN_COMMUNICATION, so the mode is set
   * while any player needs the earpiece and put back afterwards. Changing the mode needs the
   * MODIFY_AUDIO_SETTINGS permission; without it the system ignores the call, so it is skipped.
   */
  fun requestAudioOutputUpdate() = Threading.runOnMainThread {
    val canChangeMode = appContext.checkSelfPermission(Manifest.permission.MODIFY_AUDIO_SETTINGS) ==
      PackageManager.PERMISSION_GRANTED
    val needsEarpiece = canChangeMode &&
      players.any { player -> player.audioOutput == AudioOutput.EARPIECE }
    if (needsEarpiece == isEarpieceModeActive) {
      return@runOnMainThread
    }

    isEarpieceModeActive = needsEarpiece
    if (needsEarpiece) {
      audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
      @Suppress("DEPRECATION")
      audioManager.isSpeakerphoneOn = false
    } else {
      audioManager.mode = AudioManager.MODE_NORMAL
    }
  }

  fun requestAudioFocusUpdate() = Threading.runOnMainThread {
    val requiredMixMode = determineRequiredMixMode()

    if (requiredMixMode == null) {
      abandonAudioFocus()
      return@runOnMainThread
    }

    if (currentMixAudioMode != requiredMixMode) {
      requestAudioFocus(requiredMixMode)
    }
  }

  /**
   * Whether the player is audible or about to be: it was asked to play and has not ended.
   * isPlaying is not used here, because it is false while the player buffers. Focus given up
   * during a stall lets the app that was ducked or paused come back in the middle of the video.
   */
  @MainThread
  private fun holdsAudio(player: HybridVideoPlayer): Boolean {
    val mediaPlayer = player.player
    val isLoadedOrLoading = mediaPlayer.playbackState == Player.STATE_READY ||
      mediaPlayer.playbackState == Player.STATE_BUFFERING
    return mediaPlayer.playWhenReady && isLoadedOrLoading && mediaPlayer.volume != 0f
  }

  @MainThread
  private fun determineRequiredMixMode(): MixAudioMode? {
    val activePlayers = players.filter { player -> holdsAudio(player) }

    if (activePlayers.isEmpty()) {
      return null
    }

    val anyPlayerNeedsMixWithOthers = activePlayers.any { player ->
      player.mixAudioMode == MixAudioMode.MIXWITHOTHERS
    }

    if (anyPlayerNeedsMixWithOthers) {
      abandonAudioFocus()
      return MixAudioMode.MIXWITHOTHERS
    }

    val anyPlayerNeedsExclusiveFocus = activePlayers.any { player ->
      player.mixAudioMode == MixAudioMode.DONOTMIX
    }

    val anyPlayerNeedsDucking = activePlayers.any { player ->
      player.mixAudioMode == MixAudioMode.DUCKOTHERS
    }

    return when {
      anyPlayerNeedsExclusiveFocus -> MixAudioMode.DONOTMIX
      anyPlayerNeedsDucking -> MixAudioMode.DUCKOTHERS
      else -> MixAudioMode.AUTO
    }
  }

  @MainThread
  private fun requestAudioFocus(mixMode: MixAudioMode) {
    val focusType = when (mixMode) {
      MixAudioMode.DONOTMIX -> AudioManager.AUDIOFOCUS_GAIN
      MixAudioMode.DUCKOTHERS -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      MixAudioMode.AUTO -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      MixAudioMode.MIXWITHOTHERS -> return // No focus needed for mix with others
    }

    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      requestAudioFocusNew(focusType)
    } else {
      requestAudioFocusLegacy(focusType)
    }

    if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      currentMixAudioMode = mixMode
    } else {
      currentMixAudioMode = null
      // Pause players since audio focus couldn't be obtained
      pauseActivePlayers()
    }
  }

  @MainThread
  @RequiresApi(Build.VERSION_CODES.O)
  private fun requestAudioFocusNew(focusType: Int): Int {

    audioFocusRequest = AudioFocusRequest.Builder(focusType)
      .setAudioAttributes(
        AudioAttributes.Builder().run {
          setUsage(AudioAttributes.USAGE_MEDIA)
          setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
          build()
        }
      )
      .setOnAudioFocusChangeListener(audioFocusChangeListener)
      .build()

    return audioManager.requestAudioFocus(audioFocusRequest!!)
  }

  @MainThread
  @Suppress("DEPRECATION")
  private fun requestAudioFocusLegacy(focusType: Int): Int {
    return audioManager.requestAudioFocus(
      audioFocusChangeListener,
      AudioManager.STREAM_MUSIC,
      focusType
    )
  }

  @MainThread
  private fun abandonAudioFocus() {
    if (currentMixAudioMode != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        abandonAudioFocusNew()
      } else {
        abandonAudioFocusLegacy()
      }
      currentMixAudioMode = null
      audioFocusRequest = null
    }
  }

  @MainThread
  @RequiresApi(Build.VERSION_CODES.O)
  private fun abandonAudioFocusNew() {
    audioFocusRequest?.let { request ->
      audioManager.abandonAudioFocusRequest(request)
    }
  }

  @MainThread
  @Suppress("DEPRECATION")
  private fun abandonAudioFocusLegacy() {
    audioManager.abandonAudioFocus(audioFocusChangeListener)
  }

  @MainThread
  private fun pauseActivePlayers() {
    players.forEach { player ->
      player.player.let { mediaPlayer ->
        // A buffering player is paused too, or it would start once it has data.
        if (holdsAudio(player)) {
          mediaPlayer.pause()
        }
      }
    }
  }

  @MainThread
  private fun duckActivePlayers() {
    players.forEach { player ->
      player.player.let { mediaPlayer ->
        // We need to duck the volume to 50%. After the audio focus is regained,
        // we will restore the volume to the user's volume.
        mediaPlayer.volume = mediaPlayer.volume * 0.5f
      }
    }
  }

  @MainThread
  private fun unDuckActivePlayers() {
    // Resume players that were paused due to audio focus loss
    players.forEach { player ->
      player.player.let { mediaPlayer ->
        // Restore full volume if it was ducked
        if (mediaPlayer.volume != 0f && mediaPlayer.volume.toDouble() != player.userVolume) {
          mediaPlayer.volume = player.userVolume.toFloat()
        }
      }
    }
  }
}
