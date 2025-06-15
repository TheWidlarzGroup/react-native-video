package com.video.core.extensions

import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Context.BIND_INCLUDE_CAPABILITIES
import android.content.Intent
import android.os.Build
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import com.video.core.services.playback.VideoPlaybackService
import com.video.core.services.playback.VideoPlaybackServiceConnection

fun VideoPlaybackService.Companion.startService(
  context: Context,
  serviceConnection: VideoPlaybackServiceConnection
) {
  val reactContext = NitroModules.applicationContext ?: return

  val intent = Intent(context, VideoPlaybackService::class.java)
  intent.action = VIDEO_PLAYBACK_SERVICE_INTERFACE

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    reactContext.startForegroundService(intent);
  } else {
    reactContext.startService(intent);
  }

  val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
  } else {
    BIND_AUTO_CREATE
  }

  context.bindService(intent, serviceConnection, flags)
}

@OptIn(UnstableApi::class)
fun VideoPlaybackService.Companion.stopService(
  player: HybridVideoPlayer,
  serviceConnection: VideoPlaybackServiceConnection
) {
  try {
    NitroModules.applicationContext?.currentActivity?.unbindService(serviceConnection)
    serviceConnection.unregisterPlayer(player)
  } catch (_: Exception) {}
}
