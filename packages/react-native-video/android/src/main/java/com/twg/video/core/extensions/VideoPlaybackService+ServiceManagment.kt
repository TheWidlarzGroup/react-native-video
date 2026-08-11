package com.twg.video.core.extensions

import android.content.Context
import android.content.Intent
import android.os.Build
import com.twg.video.core.services.playback.VideoPlaybackService
import com.twg.video.core.services.playback.VideoPlaybackServiceConnection

fun VideoPlaybackService.Companion.startService(
  connection: VideoPlaybackServiceConnection
) = connection.start()

fun VideoPlaybackService.Companion.stopService(
  connection: VideoPlaybackServiceConnection
) = connection.stop()

fun VideoPlaybackService.Companion.updateServicePreferences(
  connection: VideoPlaybackServiceConnection
) = connection.updatePreferences()

internal fun VideoPlaybackService.Companion.requestSystemStart(context: Context): Boolean {
  val intent = Intent(context, VideoPlaybackService::class.java).apply {
    action = VIDEO_PLAYBACK_SERVICE_INTERFACE
  }

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
    // Preserve the existing best-effort fallback for devices rejecting a foreground start.
    try {
      context.startService(intent) != null
    } catch (_: Exception) {
      false
    }
  }
}
