package com.video.core

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.LifecycleEventListener
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.video.view.VideoView
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
object VideoManager : LifecycleEventListener {
  // nitroId -> weak VideoView
  private val views = mutableMapOf<Int, WeakReference<VideoView>>()
  // player -> list of nitroIds of views that are using this player
  private val players = mutableMapOf<HybridVideoPlayer, MutableList<Int>>()

  var audioFocusManager = AudioFocusManager()

  init {
    NitroModules.applicationContext?.apply {
      addLifecycleEventListener(this@VideoManager)
    }
  }

  fun maybePassPlayerToView(player: HybridVideoPlayer) {
    val views = players[player]?.mapNotNull { getVideoViewWeakReferenceByNitroId(it)?.get() } ?: return
    val latestView = views.lastOrNull() ?: return

    player.movePlayerToVideoView(latestView)
  }

  fun registerView(view: VideoView) {
    views[view.nitroId] = WeakReference<VideoView>(view)
  }

  fun unregisterView(view: VideoView) {
    view.hybridPlayer?.let {
      removeViewFromPlayer(view, it)
    }

    views.remove(view.nitroId)
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
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    players.remove(player)
    audioFocusManager.unregisterPlayer(player)
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

  override fun onHostDestroy() {}
}
