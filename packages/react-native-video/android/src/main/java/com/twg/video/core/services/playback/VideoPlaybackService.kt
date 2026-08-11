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
import com.twg.video.core.utils.Threading
import java.lang.ref.WeakReference

class VideoPlaybackServiceBinder(val service: VideoPlaybackService): Binder()

@OptIn(UnstableApi::class)
class VideoPlaybackService : MediaSessionService() {
  // All map access is confined to the main looper.
  private val mediaSessionsList = mutableMapOf<HybridVideoPlayer, MediaSession>()
  private val startTicketLock = Any()
  private var nextStartTicketId = 0L
  private var preparedStartTicket: StartTicket? = null
  private var acceptedStartTicketId: Long? = null
  private var isDestroyed = false
  private var isServiceActive = false
  private var isCleanedUp = false
  private var binder = VideoPlaybackServiceBinder(this)
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
    val acceptance = acceptStartCommand(ticketId)
    if (!acceptance.accepted) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    activateService()
    acceptance.preparedPlayers?.let { players -> reconcilePreparedPlayers(players) }
    if (!isServiceActive) {
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
  fun unregisterPlayer(player: HybridVideoPlayer) =
    Threading.runOnMainThread { reconcilePlayer(player) }

  fun updatePlayerPreferences(player: HybridVideoPlayer) =
    Threading.runOnMainThread { reconcilePlayer(player) }

  fun detachPlayer(player: HybridVideoPlayer) = Threading.runOnMainThread {
    mediaSessionsList.remove(player)?.release()
    removePlayerFromPreparedStartTicket(player)
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
    if (isCleanedUp) {
      return
    }
    isCleanedUp = true

    stopForegroundSafely()
    isForeground = false
    stopSelf()

    val sessions = mediaSessionsList.values.toList()
    mediaSessionsList.clear()

    sessions.forEach { session -> session.release() }
  }

  // Stop the service if there are no active media sessions (no players need it)
  fun stopIfNoPlayers() = Threading.runOnMainThread {
    if (!isServiceActive || mediaSessionsList.isNotEmpty() || hasPreparedStartTicket()) {
      return@runOnMainThread
    }

    isServiceActive = false
    invalidateStartTickets()
    cleanupService()
  }

  @MainThread
  private fun stopAndInvalidate(destroyed: Boolean = false) {
    invalidateStartTickets(destroyed)
    isServiceActive = false
    cleanupService()
  }

  /**
   * Adds a player to the bounded weak-reference batch for the next explicit system start.
   */
  internal fun prepareForStart(player: HybridVideoPlayer): Long? = synchronized(startTicketLock) {
    if (isDestroyed || player.isReleasedForService) {
      return@synchronized null
    }

    val ticket = preparedStartTicket ?: StartTicket(++nextStartTicketId).also {
      preparedStartTicket = it
    }
    ticket.requestCount += 1
    ticket.players.removeAll { it.get() == null }
    if (ticket.players.none { it.get() === player }) {
      ticket.players.add(WeakReference(player))
    }
    ticket.id
  }

  /**
   * Completes one request paired with [prepareForStart] on the main looper. The start helper
   * calls this before returning, so its following binder command is ordered after promotion.
   */
  internal fun completePreparedStart(ticketId: Long, startRequested: Boolean) {
    Threading.runOnMainThread {
      var preparedPlayers: List<HybridVideoPlayer>? = null
      var discarded = false
      synchronized(startTicketLock) {
        val ticket = preparedStartTicket
        when {
          ticket?.id == ticketId -> {
            if (ticket.requestCount > 0) {
              ticket.requestCount -= 1
            }

            if (startRequested) {
              preparedPlayers = consumePreparedStartTicketLocked(ticket)
            } else if (ticket.requestCount == 0) {
              preparedStartTicket = null
              discarded = true
            }
          }
          acceptedStartTicketId == ticketId -> return@runOnMainThread
          else -> return@runOnMainThread
        }
      }

      if (preparedPlayers != null) {
        activateService()
        reconcilePreparedPlayers(preparedPlayers)
      } else if (discarded) {
        stopIfNoPlayers()
      }
    }
  }

  @MainThread
  private fun acceptStartCommand(ticketId: Long?): StartCommandAcceptance {
    return synchronized(startTicketLock) {
      if (isDestroyed) {
        return@synchronized StartCommandAcceptance.REJECTED
      }

      val ticket = preparedStartTicket
      when {
        ticketId == null -> StartCommandAcceptance.REJECTED
        ticket?.id == ticketId -> StartCommandAcceptance(
          accepted = true,
          preparedPlayers = consumePreparedStartTicketLocked(ticket)
        )
        acceptedStartTicketId == ticketId -> StartCommandAcceptance(accepted = true)
        else -> StartCommandAcceptance.REJECTED
      }
    }
  }

  @MainThread
  private fun activateService() {
    if (!isServiceActive) {
      isServiceActive = true
      isCleanedUp = false
      isForeground = false
    }
  }

  @MainThread
  private fun reconcilePlayer(player: HybridVideoPlayer) {
    reconcilePlayer(player, checkIdleAfterwards = true)
  }

  @MainThread
  private fun reconcilePreparedPlayers(players: List<HybridVideoPlayer>) {
    players.forEach { player ->
      reconcilePlayer(player, checkIdleAfterwards = false)
    }
    stopIfNoPlayers()
  }

  @MainThread
  private fun reconcilePlayer(
    player: HybridVideoPlayer,
    checkIdleAfterwards: Boolean
  ) {
    if (
      player.isReleasedForService ||
      isServiceDestroyed() ||
      !isServiceActive
    ) {
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

  private fun hasPreparedStartTicket(): Boolean = synchronized(startTicketLock) {
    preparedStartTicket != null
  }

  @MainThread
  private fun removePlayerFromPreparedStartTicket(player: HybridVideoPlayer) {
    synchronized(startTicketLock) {
      preparedStartTicket?.players?.removeAll { reference ->
        val preparedPlayer = reference.get()
        preparedPlayer == null || preparedPlayer === player
      }
    }
  }

  @MainThread
  private fun invalidateStartTickets(destroyed: Boolean = false) {
    synchronized(startTicketLock) {
      if (destroyed) {
        isDestroyed = true
      }
      preparedStartTicket = null
      acceptedStartTicketId = null
    }
  }

  @MainThread
  private fun isServiceDestroyed(): Boolean = synchronized(startTicketLock) {
    isDestroyed
  }

  private fun consumePreparedStartTicketLocked(ticket: StartTicket): List<HybridVideoPlayer> {
    preparedStartTicket = null
    acceptedStartTicketId = ticket.id
    return ticket.players.mapNotNull { reference -> reference.get() }
  }

  companion object {
    const val TAG = "VideoPlaybackService"
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE
    internal const val START_TICKET_ID_EXTRA = "com.twg.video.START_TICKET_ID"
    private const val PLACEHOLDER_NOTIFICATION_ID = 1729
    private const val NOTIFICATION_CHANNEL_ID = "twg_video_playback"
    private const val NO_START_TICKET_ID = -1L
  }

  private data class StartCommandAcceptance(
    val accepted: Boolean,
    val preparedPlayers: List<HybridVideoPlayer>? = null
  ) {
    companion object {
      val REJECTED = StartCommandAcceptance(accepted = false)
    }
  }

  private class StartTicket(val id: Long) {
    var requestCount = 0
    val players = mutableListOf<WeakReference<HybridVideoPlayer>>()
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
