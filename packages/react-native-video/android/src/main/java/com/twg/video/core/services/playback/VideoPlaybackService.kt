package com.twg.video.core.services.playback

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
import androidx.annotation.MainThread
import androidx.core.app.NotificationCompat
import com.margelo.nitro.video.HybridVideoPlayer

class VideoPlaybackServiceBinder(val service: VideoPlaybackService): Binder()

@OptIn(UnstableApi::class)
class VideoPlaybackService : MediaSessionService() {
  private enum class LifecycleState {
    INACTIVE,
    ACTIVE,
    DESTROYED
  }

  // All map access is confined to the main looper.
  private val mediaSessionsList = mutableMapOf<HybridVideoPlayer, MediaSession>()
  private var nextStartTicketId = 0L
  private val startTicketIds = mutableSetOf<Long>()
  private var lifecycleState = LifecycleState.INACTIVE
  private val binder = VideoPlaybackServiceBinder(this)
  private var isForeground = false
  private var cachedLaunchIntent: Intent? = null

  override fun onCreate() {
    super.onCreate()
    setMediaNotificationProvider(CustomMediaNotificationProvider(this))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val ticketId = intent?.takeIf { candidate ->
      candidate.hasExtra(START_TICKET_ID_EXTRA)
    }?.getLongExtra(START_TICKET_ID_EXTRA, NO_START_TICKET_ID)
    if (!acceptStartCommand(ticketId)) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    activateService()
    if (lifecycleState != LifecycleState.ACTIVE) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

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
  @MainThread
  fun unregisterPlayer(player: HybridVideoPlayer) = reconcilePlayer(player)

  @MainThread
  fun updatePlayerPreferences(player: HybridVideoPlayer) = reconcilePlayer(player)

  @MainThread
  fun detachPlayer(player: HybridVideoPlayer) {
    mediaSessionsList.remove(player)?.release()
    stopIfNoPlayers()
  }

  // Callbacks

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = null

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopAndInvalidate()
  }

  override fun onDestroy() {
    stopAndInvalidate(destroyed = true)
    super.onDestroy()
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
  private fun cleanupService() {
    stopForegroundSafely()
    isForeground = false
    stopSelf()

    val sessions = mediaSessionsList.values.toList()
    mediaSessionsList.clear()

    sessions.forEach { session -> session.release() }
  }

  // Stop the service if there are no active media sessions (no players need it)
  @MainThread
  fun stopIfNoPlayers() {
    if (lifecycleState != LifecycleState.ACTIVE || mediaSessionsList.isNotEmpty()) {
      return
    }

    lifecycleState = LifecycleState.INACTIVE
    invalidateStartTickets()
    cleanupService()
  }

  @MainThread
  private fun stopAndInvalidate(destroyed: Boolean = false) {
    lifecycleState = if (destroyed) LifecycleState.DESTROYED else LifecycleState.INACTIVE
    invalidateStartTickets()
    cleanupService()
  }

  /**
   * Reserves a player-bound ticket for the next explicit system start.
   */
  @MainThread
  internal fun prepareForStart(player: HybridVideoPlayer): Long? {
    if (lifecycleState == LifecycleState.DESTROYED || player.isReleasedForService) {
      return null
    }

    val ticketId = ++nextStartTicketId
    startTicketIds.add(ticketId)
    return ticketId
  }

  /**
   * Completes the system start paired with [prepareForStart].
   */
  @MainThread
  internal fun completePreparedStart(
    ticketId: Long,
    player: HybridVideoPlayer,
    startRequested: Boolean
  ) {
    if (ticketId !in startTicketIds) {
      return
    }

    if (startRequested) {
      activateService()
      reconcilePlayer(player)
    } else {
      startTicketIds.remove(ticketId)
      stopIfNoPlayers()
    }
  }

  @MainThread
  private fun acceptStartCommand(ticketId: Long?): Boolean {
    return lifecycleState != LifecycleState.DESTROYED &&
      ticketId != null && startTicketIds.remove(ticketId)
  }

  @MainThread
  private fun activateService() {
    if (lifecycleState == LifecycleState.INACTIVE) {
      lifecycleState = LifecycleState.ACTIVE
      isForeground = false
    }
  }

  @MainThread
  private fun reconcilePlayer(player: HybridVideoPlayer) {
    reconcilePlayer(player, checkIdleAfterwards = true)
  }

  @MainThread
  private fun reconcilePlayer(
    player: HybridVideoPlayer,
    checkIdleAfterwards: Boolean
  ) {
    if (player.isReleasedForService) {
      mediaSessionsList.remove(player)?.release()
      if (checkIdleAfterwards) {
        stopIfNoPlayers()
      }
      return
    }

    if (lifecycleState != LifecycleState.ACTIVE) {
      return
    }

    if (player.playInBackground || player.showNotificationControls) {
      ensurePlayerSession(player)
    } else {
      mediaSessionsList.remove(player)?.release()
      if (checkIdleAfterwards) {
        stopIfNoPlayers()
      }
    }
  }

  @MainThread
  private fun ensurePlayerSession(player: HybridVideoPlayer) {
    if (mediaSessionsList.containsKey(player)) {
      return
    }

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
        val intentToUse = launchIntent.clone() as Intent
        intentToUse.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
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

  @MainThread
  private fun invalidateStartTickets() {
    startTicketIds.clear()
  }

  companion object {
    const val TAG = "VideoPlaybackService"
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE
    internal const val START_TICKET_ID_EXTRA = "com.twg.video.START_TICKET_ID"
    private const val PLACEHOLDER_NOTIFICATION_ID = 1729
    private const val NOTIFICATION_CHANNEL_ID = "twg_video_playback"
    private const val NO_START_TICKET_ID = -1L
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
