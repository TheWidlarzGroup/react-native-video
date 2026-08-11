package com.twg.video.core.services.playback

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.margelo.nitro.video.HybridVideoPlayer

class VideoPlaybackServiceBinder(val service: VideoPlaybackService) : Binder()

@OptIn(UnstableApi::class)
class VideoPlaybackService : MediaSessionService() {
  // Service callbacks and all public mutation below are confined to the main looper.
  private val mediaSessionsList = mutableMapOf<HybridVideoPlayer, MediaSession>()
  private val binder = VideoPlaybackServiceBinder(this)
  private var isForeground = false
  private var cachedLaunchIntent: Intent? = null

  override fun onCreate() {
    super.onCreate()
    setMediaNotificationProvider(CustomMediaNotificationProvider(this))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // A foreground start has a strict promotion deadline. Register-before-start means a valid
    // request already has a session; stale requests are promoted and removed in the same callback.
    try {
      if (!isForeground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForeground(PLACEHOLDER_NOTIFICATION_ID, createPlaceholderNotification())
        isForeground = true
      }
    } catch (_: Exception) {
      Log.e(TAG, "Failed to start foreground service!")
    }

    if (mediaSessionsList.isEmpty()) {
      stopIfNoPlayers()
      stopSelf(startId)
      return START_NOT_STICKY
    }

    return super.onStartCommand(intent, flags, startId)
  }

  @MainThread
  fun registerPlayer(player: HybridVideoPlayer): Boolean {
    if (player.isReleaseStarted || (!player.playInBackground && !player.showNotificationControls)) {
      return false
    }

    ensurePlayerSession(player)
    return mediaSessionsList.containsKey(player)
  }

  @MainThread
  fun unregisterPlayer(player: HybridVideoPlayer) {
    mediaSessionsList.remove(player)?.release()
    stopIfNoPlayers()
  }

  @MainThread
  fun updatePlayerPreferences(player: HybridVideoPlayer) {
    if (player.isReleaseStarted || (!player.playInBackground && !player.showNotificationControls)) {
      unregisterPlayer(player)
    } else {
      ensurePlayerSession(player)
    }
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = null

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    cleanupService()
  }

  override fun onDestroy() {
    cleanupService()
    super.onDestroy()
  }

  @MainThread
  fun stopIfNoPlayers() {
    if (mediaSessionsList.isNotEmpty()) return
    stopForegroundSafely()
    isForeground = false
    stopSelf()
  }

  @MainThread
  private fun cleanupService() {
    stopForegroundSafely()
    isForeground = false
    stopSelf()

    val sessions = mediaSessionsList.values.toList()
    mediaSessionsList.clear()
    sessions.forEach(MediaSession::release)
  }

  @MainThread
  private fun stopForegroundSafely() {
    try {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } catch (_: Exception) {
      Log.e(TAG, "Failed to stop foreground service!")
    }
  }

  @MainThread
  private fun ensurePlayerSession(player: HybridVideoPlayer) {
    if (mediaSessionsList.containsKey(player)) return

    val builder = MediaSession.Builder(this, player.player)
      .setId("RNVideoPlaybackService_" + player.hashCode())
      .setCallback(VideoPlaybackCallback())

    try {
      var launchIntent = cachedLaunchIntent
      if (launchIntent == null) {
        launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        cachedLaunchIntent = launchIntent
      }

      if (launchIntent != null) {
        val intentToUse = launchIntent.clone() as Intent
        intentToUse.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        builder.setSessionActivity(
          PendingIntent.getActivity(
            this,
            0,
            intentToUse,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
          )
        )
      }
    } catch (_: Exception) {}

    val mediaSession = builder.build()
    mediaSessionsList[player] = mediaSession
    addSession(mediaSession)
  }

  companion object {
    const val TAG = "VideoPlaybackService"
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE
    private const val PLACEHOLDER_NOTIFICATION_ID = 1729
    private const val NOTIFICATION_CHANNEL_ID = "twg_video_playback"
  }

  private fun createPlaceholderNotification(): Notification {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        if (notificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_ID) == null) {
          val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "Media playback",
            NotificationManager.IMPORTANCE_LOW
          )
          channel.setShowBadge(false)
          notificationManager.createNotificationChannel(channel)
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
        applicationInfo.nonLocalizedLabel?.toString()
          ?: applicationInfo.loadLabel(packageManager).toString()
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
