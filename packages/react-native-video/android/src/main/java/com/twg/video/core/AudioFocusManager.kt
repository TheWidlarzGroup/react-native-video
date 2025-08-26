package com.twg.video.core

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.AudioFocusRequest
import android.os.Build
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.MixAudioMode
import kotlin.getValue
import com.twg.video.core.utils.Threading

@OptIn(UnstableApi::class)
class AudioFocusManager() {
  private val players = mutableListOf<HybridVideoPlayer>()
  private var currentMixAudioMode: MixAudioMode? = null
  private var audioFocusRequest: AudioFocusRequest? = null

  val appContext by lazy {
    NitroModules.applicationContext ?: throw UnknownError()
  }

  private val audioManager by lazy {
    appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: throw UnknownError()
  }

  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
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

  fun registerPlayer(player: HybridVideoPlayer) {
    if (!players.contains(player)) {
      players.add(player)
    }
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    players.remove(player)
    if (players.isEmpty()) {
      abandonAudioFocus()
    } else {
      requestAudioFocusUpdate()
    }
  }

  fun requestAudioFocusUpdate() {
    Threading.runOnMainThread {
      val requiredMixMode = determineRequiredMixMode()

      if (requiredMixMode == null) {
        abandonAudioFocus()
        return@runOnMainThread
      }

      if (currentMixAudioMode != requiredMixMode) {
        requestAudioFocus(requiredMixMode)
      }
    }
  }

  private fun determineRequiredMixMode(): MixAudioMode? {
    val activePlayers = players.filter { player ->
      player.player?.isPlaying == true && player.player?.volume != 0f
    }

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

  @Suppress("DEPRECATION")
  private fun requestAudioFocusLegacy(focusType: Int): Int {
    return audioManager.requestAudioFocus(
      audioFocusChangeListener,
      AudioManager.STREAM_MUSIC,
      focusType
    )
  }

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

  @RequiresApi(Build.VERSION_CODES.O)
  private fun abandonAudioFocusNew() {
    audioFocusRequest?.let { request ->
      audioManager.abandonAudioFocusRequest(request)
    }
  }

  @Suppress("DEPRECATION")
  private fun abandonAudioFocusLegacy() {
    audioManager.abandonAudioFocus(audioFocusChangeListener)
  }

  private fun pauseActivePlayers() {
    Threading.runOnMainThread {
      players.forEach { player ->
        player.player?.let { mediaPlayer ->
          if (mediaPlayer.volume != 0f && mediaPlayer.isPlaying) {
            mediaPlayer.pause()
          }
        }
      }
    }
  }

  private fun duckActivePlayers() {
    Threading.runOnMainThread {
      players.forEach { player ->
        player.player?.let { mediaPlayer ->
          // We need to duck the volume to 50%. After the audio focus is regained,
          // we will restore the volume to the user's volume.
          mediaPlayer.volume = mediaPlayer.volume * 0.5f
        }
      }
    }
  }

  private fun unDuckActivePlayers() {
    Threading.runOnMainThread {
      // Resume players that were paused due to audio focus loss
      players.forEach { player ->
        player.player?.let { mediaPlayer ->
          // Restore full volume if it was ducked
          if (mediaPlayer.volume != 0f && mediaPlayer.volume.toDouble() != player.userVolume) {
            mediaPlayer.volume = player.userVolume.toFloat()
          }
        }
      }
    }
  }
}

