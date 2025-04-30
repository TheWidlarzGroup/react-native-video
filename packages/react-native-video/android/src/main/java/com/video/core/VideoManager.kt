package com.video.core

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.HybridVideoPlayer
import com.video.core.activities.FullscreenVideoViewActivity
import com.video.view.VideoView
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
object VideoManager {
  // nitroId -> weak VideoView
  private val views = mutableMapOf<Int, WeakReference<VideoView>>()
  // player -> list of nitroIds of views that are using this player
  private val players = mutableMapOf<HybridVideoPlayer, MutableList<Int>>()
  // fullscreen activity id (hash code) -> weak FullscreenVideoViewActivity
  private val fullscreenActivities = mutableMapOf<Int, WeakReference<FullscreenVideoViewActivity>>()

  fun maybePassPlayerToView(player: HybridVideoPlayer) {
    // If we have fullscreen activity open, we don't want to move player from it
    // Fullscreen activity will attach player to view after destroy
    if (fullscreenActivities.isNotEmpty()) {
      return
    }

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

  fun removeViewFromPlayer(view: VideoView, player: HybridVideoPlayer, moveToLatestView: Boolean = true) {
    players[player]?.remove(view.nitroId)
    if(moveToLatestView) maybePassPlayerToView(player)
  }

  fun registerPlayer(player: HybridVideoPlayer) {
    players[player] = players.getOrDefault(player, mutableListOf())
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    // clear player from all views
    val views = players[player]?.mapNotNull { getVideoViewWeakReferenceByNitroId(it)?.get() } ?: return

    views.forEach { view ->
      // We are destroying player, so we don't need to look for a new view
      removeViewFromPlayer(view, player, moveToLatestView = false)
    }

    // Clear player from views
    views.forEach {
      it.hybridPlayer = null
    }

    players.remove(player)
  }

  fun registerFullscreenActivity(activity: FullscreenVideoViewActivity, id: Int) {
    fullscreenActivities[id] = WeakReference(activity)
  }

  fun unregisterFullscreenActivity(id: Int, player: HybridVideoPlayer?, moveToLatestView: Boolean = true) {
    fullscreenActivities.remove(id)

    if (player != null && moveToLatestView) {
      maybePassPlayerToView(player)
    }
  }

  fun getVideoViewWeakReferenceByNitroId(nitroId: Int): WeakReference<VideoView>? {
    return views[nitroId]
  }

  fun updateVideoViewNitroId(oldNitroId: Int, newNitroId: Int, view: VideoView) {
    // Update view in views map
    views.remove(oldNitroId)
    views[newNitroId] = WeakReference(view)

    // Update view in players map
    players.forEach { (_, nitroIds) ->
      // replace old id with new id (keep order)
      val index = nitroIds.indexOf(oldNitroId)

      if (index != -1) {
        nitroIds[index] = newNitroId
      }
    }

    // Update view in fullscreen activities map
    fullscreenActivities.forEach { (_, activity) ->
      if (activity.get()?.videoViewNitroId == oldNitroId) {
        activity.get()?.videoViewNitroId = newNitroId
      }
    }
  }

  fun getPlayerByNitroId(nitroId: Int): HybridVideoPlayer? {
    return players.entries.firstOrNull { it.value.contains(nitroId) }?.key
  }
}
