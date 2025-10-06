package com.twg.video.core.services.playback

import android.content.ComponentName
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class VideoPlaybackServiceConnection (private val player: WeakReference<HybridVideoPlayer>) :
    ServiceConnection {
  var serviceBinder: VideoPlaybackServiceBinder? = null

  override fun onServiceConnected(componentName: ComponentName?, binder: IBinder?) {
    val player = player.get() ?: return

    try {
      val activity = NitroModules.Companion.applicationContext?.currentActivity ?: run {
        Log.e("VideoPlaybackServiceConnection", "Activity is null")
        return
      }

      serviceBinder = binder as? VideoPlaybackServiceBinder
      // Only register when the player actually needs background service/notification
      if (player.playInBackground || player.showNotificationControls) {
        serviceBinder?.service?.registerPlayer(player, activity.javaClass)
      }
    } catch (err: Exception) {
      Log.e("VideoPlaybackServiceConnection", "Could not bind to playback service", err)
    }
  }

  override fun onServiceDisconnected(componentName: ComponentName?) {
    player.get()?.let {
      unregisterPlayer(it)
    }
    serviceBinder = null
  }

  override fun onNullBinding(componentName: ComponentName?) {
    Log.e(
      "VideoPlaybackServiceConnection",
      "Could not bind to playback service - there can be issues with background playback" +
        "and notification controls"
    )
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    try {
      if (serviceBinder?.service != null) {
        serviceBinder?.service?.unregisterPlayer(player)
      }
    } catch (_: Exception) {}
  }
}
