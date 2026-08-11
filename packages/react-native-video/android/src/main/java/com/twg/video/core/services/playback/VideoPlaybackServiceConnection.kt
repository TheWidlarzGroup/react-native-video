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
import com.twg.video.core.extensions.requestSystemStart
import com.twg.video.core.utils.Threading
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class VideoPlaybackServiceConnection(
  private val player: WeakReference<HybridVideoPlayer>,
  context: Context
) : ServiceConnection {
  private sealed interface ConnectionState {
    data object Disconnected : ConnectionState
    data object Binding : ConnectionState
    data class Connected(val binder: VideoPlaybackServiceBinder) : ConnectionState
  }

  // Android keys service dispatchers by the exact Context instance used to bind.
  private val context = context.applicationContext ?: context
  private var state: ConnectionState = ConnectionState.Disconnected

  @MainThread
  override fun onServiceConnected(componentName: ComponentName?, binder: IBinder?) {
    val connectedBinder = binder as? VideoPlaybackServiceBinder
    if (state != ConnectionState.Binding || connectedBinder == null) {
      unbind()
      return
    }

    state = ConnectionState.Connected(connectedBinder)
    val player = player.get()
    if (player == null || !wantsService(player)) {
      player?.let { connectedBinder.service.unregisterPlayer(it) }
      unbind()
      return
    }

    startConnected(connectedBinder.service, player)
  }

  @MainThread
  override fun onServiceDisconnected(componentName: ComponentName?) {
    if (state is ConnectionState.Connected) {
      state = ConnectionState.Binding
    }
  }

  @MainThread
  override fun onBindingDied(componentName: ComponentName?) {
    unbind()
    player.get()?.takeIf(::wantsService)?.let { bind() }
  }

  @MainThread
  override fun onNullBinding(componentName: ComponentName?) {
    Log.e(
      TAG,
      "Could not bind to playback service - background playback and notification controls are unavailable"
    )
    unbind()
  }

  fun start() = Threading.runOnMainThread {
    val player = player.get()
    if (player == null || !wantsService(player)) {
      disconnect()
      return@runOnMainThread
    }

    when (val state = state) {
      ConnectionState.Disconnected -> bind()
      ConnectionState.Binding -> Unit
      is ConnectionState.Connected -> startConnected(state.binder.service, player)
    }
  }

  fun stop() = Threading.runOnMainThread {
    disconnect()
  }

  fun updatePreferences() = Threading.runOnMainThread {
    val player = player.get()
    if (player == null || !wantsService(player)) {
      disconnect()
      return@runOnMainThread
    }

    when (val state = state) {
      ConnectionState.Disconnected -> bind()
      ConnectionState.Binding -> Unit
      is ConnectionState.Connected -> state.binder.service.updatePlayerPreferences(player)
    }
  }

  @MainThread
  private fun wantsService(player: HybridVideoPlayer): Boolean =
    !player.isReleaseStarted &&
      (player.playInBackground || player.showNotificationControls)

  @MainThread
  private fun disconnect() {
    val connected = state as? ConnectionState.Connected
    player.get()?.let { connected?.binder?.service?.unregisterPlayer(it) }
    unbind()
  }

  @MainThread
  private fun bind() {
    if (state != ConnectionState.Disconnected) return
    val player = player.get() ?: return
    if (!wantsService(player)) return

    val intent = Intent(context, VideoPlaybackService::class.java).apply {
      action = VideoPlaybackService.VIDEO_PLAYBACK_SERVICE_INTERFACE
    }
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
    } else {
      BIND_AUTO_CREATE
    }

    state = ConnectionState.Binding
    val bound = try {
      context.bindService(intent, this, flags)
    } catch (_: Exception) {
      false
    }
    if (!bound) {
      state = ConnectionState.Disconnected
    }
  }

  @MainThread
  private fun unbind() {
    if (state == ConnectionState.Disconnected) return
    state = ConnectionState.Disconnected
    try {
      context.unbindService(this)
    } catch (_: Exception) {}
  }

  @MainThread
  private fun startConnected(
    service: VideoPlaybackService,
    player: HybridVideoPlayer
  ) {
    if (!wantsService(player) || !service.registerPlayer(player)) {
      service.unregisterPlayer(player)
      unbind()
      return
    }

    if (!VideoPlaybackService.requestSystemStart(context)) {
      service.unregisterPlayer(player)
      unbind()
    }
  }

  private companion object {
    const val TAG = "VideoPlaybackServiceConnection"
  }
}
