package com.twg.video.core.services.playback

import android.content.ComponentName
import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Context.BIND_INCLUDE_CAPABILITIES
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.HybridVideoPlayer
import com.twg.video.core.utils.Threading
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class VideoPlaybackServiceConnection(
  private val player: WeakReference<HybridVideoPlayer>,
  context: Context
) : ServiceConnection {
  // Android keys service dispatchers by the exact Context instance used to bind.
  private val context = context.applicationContext ?: context
  private var isBound = false
  private var serviceBinder: VideoPlaybackServiceBinder? = null
  private var isStartDesired = false

  @MainThread
  override fun onServiceConnected(componentName: ComponentName?, binder: IBinder?) {
    val connectedBinder = binder as? VideoPlaybackServiceBinder
    val player = player.get()

    if (!isBound || connectedBinder == null || player == null || player.isReleasedForService) {
      connectedBinder?.service?.stopIfNoPlayers()
      if (isBound) {
        unbind()
      }
      return
    }

    serviceBinder = connectedBinder
    if (!isStartDesired) {
      connectedBinder.service.stopIfNoPlayers()
      unbind()
      return
    }

    requestServiceStart(connectedBinder.service, player)
  }

  @MainThread
  override fun onServiceDisconnected(componentName: ComponentName?) {
    serviceBinder = null
    if (!isStartDesired) {
      unbind()
    }
  }

  @MainThread
  override fun onBindingDied(componentName: ComponentName?) {
    serviceBinder = null
    unbind()
    if (isStartDesired) {
      bind()
    }
  }

  @MainThread
  override fun onNullBinding(componentName: ComponentName?) {
    Log.e(
      TAG,
      "Could not bind to playback service - there can be issues with background playback" +
        "and notification controls"
    )
    unbind()
  }

  fun start() = Threading.runOnMainThread {
    val player = player.get()
    if (player == null || player.isReleasedForService) {
      isStartDesired = false
      unbind()
      return@runOnMainThread
    }

    isStartDesired = true
    val service = serviceBinder?.service
    if (service == null) {
      bind()
    } else {
      requestServiceStart(service, player)
    }
  }

  fun stop() = Threading.runOnMainThread {
    isStartDesired = false
    player.get()?.let { player ->
      try {
        serviceBinder?.service?.unregisterPlayer(player)
      } catch (_: Exception) {}
    }
    unbind()
  }

  fun updatePreferences() = Threading.runOnMainThread {
    player.get()?.let { player ->
      try {
        serviceBinder?.service?.updatePlayerPreferences(player)
      } catch (_: Exception) {}
    }
  }

  fun detach() = Threading.runOnMainThread {
    isStartDesired = false
    player.get()?.let { player ->
      try {
        serviceBinder?.service?.detachPlayer(player)
      } catch (_: Exception) {}
    }
    unbind()
  }

  @MainThread
  private fun bind() {
    val player = player.get()
    if (!isStartDesired || isBound || player == null || player.isReleasedForService) {
      return
    }

    val intent = Intent(context, VideoPlaybackService::class.java).apply {
      action = VideoPlaybackService.VIDEO_PLAYBACK_SERVICE_INTERFACE
    }
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
    } else {
      BIND_AUTO_CREATE
    }

    // Mark the dispatcher before binding so even an immediate callback sees consistent state.
    isBound = true
    val bound = try {
      context.bindService(intent, this, flags)
    } catch (_: Exception) {
      false
    }
    if (!bound) {
      unbind()
    }
  }

  @MainThread
  private fun unbind() {
    serviceBinder = null
    if (!isBound) {
      return
    }

    isBound = false
    try {
      context.unbindService(this)
    } catch (_: Exception) {}
  }

  @MainThread
  private fun requestServiceStart(
    service: VideoPlaybackService,
    player: HybridVideoPlayer
  ) {
    val ticketId = service.prepareForStart(player) ?: run {
      unbind()
      if (isStartDesired && !player.isReleasedForService) {
        bind()
      }
      return
    }

    if (player.isReleasedForService) {
      isStartDesired = false
      service.completePreparedStart(ticketId, player, false)
      unbind()
      return
    }

    val intent = Intent(context, VideoPlaybackService::class.java).apply {
      action = VideoPlaybackService.VIDEO_PLAYBACK_SERVICE_INTERFACE
      putExtra(VideoPlaybackService.START_TICKET_ID_EXTRA, ticketId)
    }
    service.completePreparedStart(ticketId, player, requestSystemStart(intent))
  }

  @MainThread
  private fun requestSystemStart(intent: Intent): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return try {
        context.startService(intent) != null
      } catch (_: Exception) {
        false
      }
    }

    return try {
      context.startForegroundService(intent) != null
    } catch (_: Exception) {
      // Preserve the existing best-effort fallback for devices that reject foreground start.
      try {
        context.startService(intent) != null
      } catch (_: Exception) {
        false
      }
    }
  }

  private companion object {
    const val TAG = "VideoPlaybackServiceConnection"
  }
}
