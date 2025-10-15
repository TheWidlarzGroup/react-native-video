package com.twg.video.core.services.playback

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.BitmapLoader
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.SimpleBitmapLoader
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class VideoPlaybackServiceBinder(val service: VideoPlaybackService): Binder()

@OptIn(UnstableApi::class)
class VideoPlaybackService : MediaSessionService() {
  private var mediaSessionsList = mutableMapOf<HybridVideoPlayer, MediaSession>()
  private var binder = VideoPlaybackServiceBinder(this)
  private var sourceActivity: Class<Activity>? = null // retained for future deep-links; currently unused
  private var isForeground = false

  override fun onCreate() {
    super.onCreate()
    setMediaNotificationProvider(CustomMediaNotificationProvider(this))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Ensure we call startForeground quickly on newer Android versions to avoid
    // ForegroundServiceDidNotStartInTimeException when startForegroundService(...) was used.
    try {
      if (!isForeground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForeground(PLACEHOLDER_NOTIFICATION_ID, createPlaceholderNotification())
        isForeground = true
      }
    } catch (_: Exception) {}

    return super.onStartCommand(intent, flags, startId)
  }

  // Player Registry
  fun registerPlayer(player: HybridVideoPlayer, from: Class<Activity>) {
    if (mediaSessionsList.containsKey(player)) {
      return
    }
    sourceActivity = from

    val builder = MediaSession.Builder(this, player.player)
      .setId("RNVideoPlaybackService_" + player.hashCode())
      .setCallback(VideoPlaybackCallback())

    // Ensure tapping the notification opens the app via sessionActivity
    try {
      val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val contentIntent = PendingIntent.getActivity(
          this,
          0,
          launchIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        builder.setSessionActivity(contentIntent)
      }
    } catch (_: Exception) {}


    val mediaSession = builder.build()

    mediaSessionsList[player] = mediaSession
    addSession(mediaSession)
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    val session = mediaSessionsList.remove(player)
    session?.release()
    stopIfNoPlayers()
  }

  fun updatePlayerPreferences(player: HybridVideoPlayer) {
    val session = mediaSessionsList[player]
    if (session == null) {
      // If not registered but now needs it, register
      if (player.playInBackground || player.showNotificationControls) {
        val activity = try { NitroModules.applicationContext?.currentActivity } catch (_: Exception) { null }
        if (activity != null) registerPlayer(player, activity.javaClass)
      }
      return
    }

    // If no longer needs registration, unregister and possibly stop service
    if (!player.playInBackground && !player.showNotificationControls) {
      unregisterPlayer(player)
      stopIfNoPlayers()
      return
    }
  }

  // Callbacks

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = null

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopForegroundSafely()
    cleanup()
    stopSelf()
  }

  override fun onDestroy() {
    stopForegroundSafely()
    cleanup()
    super.onDestroy()
  }

  private fun stopForegroundSafely() {
    try {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } catch (_: Exception) {}
  }

  private fun cleanup() {
    stopForegroundSafely()
    stopSelf()
    mediaSessionsList.forEach { (_, session) ->
      session.release()
    }
    mediaSessionsList.clear()
  }

  // Stop the service if there are no active media sessions (no players need it)
  fun stopIfNoPlayers() {
    if (mediaSessionsList.isEmpty()) {
      // Remove placeholder notification and stop the service when no active players exist
      try {
        if (isForeground) {
          stopForegroundSafely()
          isForeground = false
        }
      } catch (_: Exception) {}
      cleanup()
    }
  }

  companion object {
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE
    private const val PLACEHOLDER_NOTIFICATION_ID = 1729
    private const val NOTIFICATION_CHANNEL_ID = "twg_video_playback"
  }

  private fun createPlaceholderNotification(): Notification {
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val channel = NotificationChannel(
          NOTIFICATION_CHANNEL_ID,
          "Media playback",
          NotificationManager.IMPORTANCE_LOW
        )
        channel.setShowBadge(false)
        nm.createNotificationChannel(channel)
      } catch (_: Exception) {}
    }

    val appName = try { applicationInfo.loadLabel(packageManager).toString() } catch (_: Exception) { "" }

    return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentTitle(appName)
      .setContentText("")
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .build()
  }
}
