package com.twg.video.core.extensions

import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Context.BIND_INCLUDE_CAPABILITIES
import android.content.Intent
import android.os.Build
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.HybridVideoPlayer
import com.twg.video.core.services.playback.VideoPlaybackService
import com.twg.video.core.services.playback.VideoPlaybackServiceConnection

fun VideoPlaybackService.Companion.startService(
  player: HybridVideoPlayer,
  context: Context,
  serviceConnection: VideoPlaybackServiceConnection
) {
  if (!serviceConnection.isStartDesired || serviceConnection.isFinallyDetached ||
    player.isReleasedForService) {
    return
  }

  val intent = Intent(context, VideoPlaybackService::class.java)
  intent.action = VIDEO_PLAYBACK_SERVICE_INTERFACE
  val service = serviceConnection.serviceBinder?.service
  if (service == null) {
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
    } else {
      BIND_AUTO_CREATE
    }
    serviceConnection.bind(context, intent, flags)
    return
  }

  val preparedStartTicket = service.prepareForStart(player)
  if (preparedStartTicket == null) {
    return
  }
  intent.putExtra(VideoPlaybackService.START_TICKET_ID_EXTRA, preparedStartTicket)

  if (!serviceConnection.isStartDesired || player.isReleasedForService) {
    service.completePreparedStart(preparedStartTicket, false)
    return
  }

  // Use startForegroundService on O+ so the service has the opportunity to call
  // startForeground(...) quickly and avoid ForegroundServiceDidNotStartInTimeException.
  val startRequested = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    try {
      context.startForegroundService(intent) != null
    } catch (_: Exception) {
      // Fall back to startService if anything goes wrong
      try { context.startService(intent) != null } catch (_: Exception) { false }
    }
  } else {
    try { context.startService(intent) != null } catch (_: Exception) { false }
  }
  service.completePreparedStart(preparedStartTicket, startRequested)
}

@OptIn(UnstableApi::class)
fun VideoPlaybackService.Companion.stopService(
  player: HybridVideoPlayer,
  serviceConnection: VideoPlaybackServiceConnection
) {
  // Unregister the player first; this might stop the service if no players remain
  serviceConnection.stopPlayer(player)
  // Then unbind
  serviceConnection.unbindIfStopped()
}

@OptIn(UnstableApi::class)
fun VideoPlaybackService.Companion.detachPlayer(
  player: HybridVideoPlayer,
  serviceConnection: VideoPlaybackServiceConnection
) {
  serviceConnection.detachPlayer(player)
  serviceConnection.unbind()
}
