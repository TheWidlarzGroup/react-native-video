package com.twg.video.core

import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.LifecycleEventListener
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.MixAudioMode
import com.twg.video.core.plugins.PluginsRegistry
import com.twg.video.view.VideoView
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
object VideoManager : LifecycleEventListener {
  private const val TAG = "VideoManager"
  
  // nitroId -> weak VideoView
  private val views = mutableMapOf<Int, WeakReference<VideoView>>()
  // player -> list of nitroIds of views that are using this player
  private val players = mutableMapOf<HybridVideoPlayer, MutableList<Int>>()
  
  // Keep track of players that were paused due to PiP so that they can be resumed later
  private val playersPausedForPip = mutableSetOf<HybridVideoPlayer>()
  
  private var currentPipVideoView: WeakReference<VideoView>? = null

  var audioFocusManager = AudioFocusManager()

  private var lastPlayedNitroId: Int? = null

  init {
    NitroModules.applicationContext?.apply {
      addLifecycleEventListener(this@VideoManager)
    }
  }

  fun requestPictureInPicture(videoView: VideoView): Boolean {
    Log.d(TAG, "PiP requested for video nitroId: ${videoView.nitroId}")
    
    if (videoView.isInPictureInPicture) {
      Log.d(TAG, "Video nitroId: ${videoView.nitroId} is already in PiP")
      return true
    }
    
    // Exit PiP from current video if there is one
    currentPipVideoView?.get()?.let { currentPipVideo ->
      if (currentPipVideo != videoView && currentPipVideo.isInPictureInPicture) {
        Log.d(TAG, "Forcing exit PiP for video nitroId: ${currentPipVideo.nitroId} to make room for nitroId: ${videoView.nitroId}")
        currentPipVideo.forceExitPictureInPicture()
      }
    }
    
    // Ensure the player that belongs to this view is attached back to this view
    videoView.hybridPlayer?.movePlayerToVideoView(videoView)
    
    // Pause every other player that might be playing in the background so that only the PiP video plays
    pauseOtherPlayers(videoView)
    
    // Set this video as the designated PiP video BEFORE entering PiP mode
    // This ensures the PictureInPictureHelperFragment callbacks know which video should respond
    currentPipVideoView = WeakReference(videoView)
    Log.d(TAG, "Designated video nitroId: ${videoView.nitroId} as the PiP video")
    
    val success = videoView.internalEnterPictureInPicture()
    Log.d(TAG, "PiP enter result for video nitroId: ${videoView.nitroId} = $success")
    
    if (!success) {
      // If we failed to enter PiP, resume any players we just paused
      resumePlayersPausedForPip()
      currentPipVideoView = null
      Log.w(TAG, "Failed to enter PiP, clearing designated PiP video")
    }
    
    return success
  }
  
  fun notifyPictureInPictureExited(videoView: VideoView) {
    Log.d(TAG, "PiP exit notification for video nitroId: ${videoView.nitroId}")
    currentPipVideoView?.get()?.let { currentPipVideo ->
      if (currentPipVideo == videoView) {
        Log.d(TAG, "Clearing PiP reference for video nitroId: ${videoView.nitroId}")
        currentPipVideoView = null
        // Resume any players that were paused when PiP was entered
        resumePlayersPausedForPip()
      }
    }
  }
  
  fun getCurrentPictureInPictureVideo(): VideoView? {
    return currentPipVideoView?.get()
  }
  
  fun setCurrentPictureInPictureVideo(videoView: VideoView) {
    Log.d(TAG, "Setting current PiP video to nitroId: ${videoView.nitroId}")
    currentPipVideoView = WeakReference(videoView)
  }
  
  fun isAnyVideoInPictureInPicture(): Boolean {
    return currentPipVideoView?.get()?.isInPictureInPicture == true
  }
  
  fun forceExitAllPictureInPicture() {
    currentPipVideoView?.get()?.let { currentPipVideo ->
      if (currentPipVideo.isInPictureInPicture) {
        currentPipVideo.forceExitPictureInPicture()
      }
    }
    currentPipVideoView = null
  }

  fun maybePassPlayerToView(player: HybridVideoPlayer) {
    val views = players[player]?.mapNotNull { getVideoViewWeakReferenceByNitroId(it)?.get() } ?: return
    val latestView = views.lastOrNull() ?: return

    player.movePlayerToVideoView(latestView)
  }

  fun registerView(view: VideoView) {
    views[view.nitroId] = WeakReference<VideoView>(view)
    PluginsRegistry.shared.notifyVideoViewCreated(WeakReference(view))
  }

  fun unregisterView(view: VideoView) {
    view.hybridPlayer?.let {
      removeViewFromPlayer(view, it)
    }

    // Clean up PiP reference if this view was in PiP
    currentPipVideoView?.get()?.let { currentPipVideo ->
      if (currentPipVideo == view) {
        currentPipVideoView = null
      }
    }

    views.remove(view.nitroId)
    PluginsRegistry.shared.notifyVideoViewDestroyed(WeakReference(view))
  }

  fun addViewToPlayer(view: VideoView, player: HybridVideoPlayer) {
    // Add player to list if it doesn't exist (should not happen)
    if(!players.containsKey(player)) players[player] = mutableListOf()

    // Check if view is already added to player
    if(players[player]?.contains(view.nitroId) == true) return

    // Add view to player
    players[player]?.add(view.nitroId)
  }

  fun removeViewFromPlayer(view: VideoView, player: HybridVideoPlayer) {
    players[player]?.remove(view.nitroId)

    // If this was the last view using this player, clean up
    if (players[player]?.isEmpty() == true) {
      players.remove(player)
    } else {
      // If there are other views using this player, move to the latest one
      maybePassPlayerToView(player)
    }
  }

  fun registerPlayer(player: HybridVideoPlayer) {
    if (!players.containsKey(player)) {
      players[player] = mutableListOf()
    }

    audioFocusManager.registerPlayer(player)
    PluginsRegistry.shared.notifyPlayerCreated(WeakReference(player))
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    players.remove(player)
    audioFocusManager.unregisterPlayer(player)
    PluginsRegistry.shared.notifyPlayerDestroyed(WeakReference(player))
  }

  fun getPlayerByNitroId(nitroId: Int): HybridVideoPlayer? {
    return players.keys.find { player ->
      players[player]?.contains(nitroId) == true
    }
  }

  fun updateVideoViewNitroId(oldNitroId: Int, newNitroId: Int, view: VideoView) {
    // Remove old mapping
    if (oldNitroId != -1) {
      views.remove(oldNitroId)

      // Update player mappings
      players.keys.forEach { player ->
        players[player]?.let { nitroIds ->
          if (nitroIds.remove(oldNitroId)) {
            nitroIds.add(newNitroId)
    }
        }
      }
    }

    // Add new mapping
    views[newNitroId] = WeakReference(view)
  }

  fun getVideoViewWeakReferenceByNitroId(nitroId: Int): WeakReference<VideoView>? {
    return views[nitroId]
  }

  // ------------ Lifecycle Handler ------------
  private fun onAppEnterForeground() {
    players.keys.forEach { player ->
      if (player.wasAutoPaused) {
        player.play()
      }
    }
  }

  private fun onAppEnterBackground() {
    players.keys.forEach { player ->
      if (!player.playInBackground && player.isPlaying) {
        player.wasAutoPaused = player.isPlaying
        player.pause()
      }
    }
  }

  override fun onHostResume() {
    onAppEnterForeground()
  }

  override fun onHostPause() {
    onAppEnterBackground()
  }

  override fun onHostDestroy() {
    forceExitAllPictureInPicture()
  }

  fun pauseOtherPlayers(pipVideoView: VideoView) {
    val pipPlayer = pipVideoView.hybridPlayer
    playersPausedForPip.clear()

    players.keys.forEach { player ->
      // Skip the player that is used for the PiP view
      if (player == pipPlayer) return@forEach

      // Pause only if it is currently playing
      if (player.isPlaying && player.mixAudioMode != MixAudioMode.MIXWITHOTHERS) {
        player.pause()
        playersPausedForPip.add(player)
        Log.v(TAG, "Paused player for PiP (nitroIds: ${players[player]})")
      }
    }
  }

  private fun resumePlayersPausedForPip() {
    playersPausedForPip.forEach { player ->
      // Ensure the player is attached to the latest visible VideoView before resuming
      maybePassPlayerToView(player)

      if (!player.isPlaying) {
        player.play()
        Log.v(TAG, "Resumed player after PiP exit (nitroIds: ${players[player]})")
      }
    }
    playersPausedForPip.clear()
  }

  fun getAnyPlayingVideoView(): VideoView? {
    return views.values.firstOrNull { ref ->
      ref.get()?.hybridPlayer?.isPlaying == true
    }?.get()
  }

  fun setLastPlayedPlayer(player: HybridVideoPlayer) {
    // Resolve to the latest view using this player (usually the last one in the list)
    val nitroIds = players[player] ?: return
    if (nitroIds.isNotEmpty()) {
      lastPlayedNitroId = nitroIds.last()
    }
  }

  fun getLastPlayedVideoView(): VideoView? {
    return lastPlayedNitroId?.let { views[it]?.get() }
  }
}
