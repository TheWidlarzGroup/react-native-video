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
  private var cachedLaunchIntent: Intent? = null

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
    } catch (_: Exception) {
      Log.e(TAG, "Failed to start foreground service!")
    }

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
      var launchIntent = cachedLaunchIntent
      if (launchIntent == null) {
        launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        cachedLaunchIntent = launchIntent
      }

      if (launchIntent != null) {
        // Clone the intent before modifying it to avoid mutating the cached instance
        val intentToUse = launchIntent.cloneFilter().apply {
          addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val contentIntent = PendingIntent.getActivity(
          this,
          0,
          intentToUse,
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
    } catch (_: Exception) {
      Log.e(TAG, "Failed to stop foreground service!")
    }
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
      } catch (_: Exception) {
        Log.e(TAG, "Failed to stop foreground service!")
      }
      cleanup()
    }
  }

  companion object {
    const val TAG = "VideoPlaybackService"
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE
    private const val PLACEHOLDER_NOTIFICATION_ID = 1729
    private const val NOTIFICATION_CHANNEL_ID = "twg_video_playback"
  }

  private fun createPlaceholderNotification(): Notification {
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        if (nm.getNotificationChannel(NOTIFICATION_CHANNEL_ID) == null) {
          val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "Media playback",
            NotificationManager.IMPORTANCE_LOW
          )
          channel.setShowBadge(false)
          nm.createNotificationChannel(channel)
        }
      } catch (_: Exception) {
        Log.e(TAG, "Failed to create notification channel!")
      }
    }

    val appName = try {
      val labelRes = applicationInfo.labelRes
      if (labelRes != 0) {
        getString(labelRes)
      } else {
        applicationInfo.nonLocalizedLabel?.toString() ?: applicationInfo.loadLabel(packageManager).toString()
      }
    } catch (_: Exception) {
      "Media Playback"
    }

    return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentTitle(appName)
      .setContentText("")
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .build()
  }
}
