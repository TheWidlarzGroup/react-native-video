package com.twg.video.core.services.playback

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.lifecycle.OnLifecycleEvent
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.MediaStyleNotificationHelper
import androidx.media3.session.SessionCommand
import androidx.media3.ui.R
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.HybridVideoPlayer
import okhttp3.internal.immutableListOf

class VideoPlaybackServiceBinder(val service: VideoPlaybackService): Binder()

@OptIn(UnstableApi::class)
class VideoPlaybackService : MediaSessionService() {
  private var mediaSessionsList = mutableMapOf<HybridVideoPlayer, MediaSession>()
  private var binder = VideoPlaybackServiceBinder(this)
  private var sourceActivity: Class<Activity>? = null
  private var placeholderCanceled = false

  // Controls for Android 13+ - see buildNotification function
  private val commandSeekForward = SessionCommand(COMMAND.SEEK_FORWARD.stringValue, Bundle.EMPTY)
  private val commandSeekBackward = SessionCommand(COMMAND.SEEK_BACKWARD.stringValue, Bundle.EMPTY)

  @SuppressLint("PrivateResource")
  private val seekForwardBtn = CommandButton.Builder()
    .setDisplayName("forward")
    .setSessionCommand(commandSeekForward)
    .setIconResId(R.drawable.exo_notification_fastforward)
    .build()

  @SuppressLint("PrivateResource")
  private val seekBackwardBtn = CommandButton.Builder()
    .setDisplayName("backward")
    .setSessionCommand(commandSeekBackward)
    .setIconResId(R.drawable.exo_notification_rewind)
    .build()

  // Player Registry
  fun registerPlayer(player: HybridVideoPlayer, from: Class<Activity>) {
    if (mediaSessionsList.containsKey(player)) {
      return
    }
    sourceActivity = from

    val builder = MediaSession.Builder(this, player.player)
      .setId("RNVideoPlaybackService_" + player.hashCode())
      .setCallback(VideoPlaybackCallback())

    // Only expose custom layout controls when requested
    if (player.showNotificationControls) {
      builder.setCustomLayout(immutableListOf(seekBackwardBtn, seekForwardBtn))
    }

    val mediaSession = builder.build()

    mediaSessionsList[player] = mediaSession
    addSession(mediaSession)

    // Manually trigger initial notification creation for the registered player
    // This ensures the player notification appears immediately, even if not playing
    onUpdateNotification(mediaSession, true)
  }

  fun unregisterPlayer(player: HybridVideoPlayer) {
    hidePlayerNotification(player.player)
    val session = mediaSessionsList.remove(player)
    session?.release()
    stopIfNoPlayers()
  }

  // Allow updating runtime flags that impact notification/controls
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

    // Update custom layout controls depending on the flag (for Android 13+ custom command buttons)
    try {
      if (player.showNotificationControls) {
        session.setCustomLayout(immutableListOf(seekBackwardBtn, seekForwardBtn))
      } else {
        session.setCustomLayout(emptyList())
      }
    } catch (_: Exception) {}

    // Rebuild notification to reflect showNotificationControls changes
    onUpdateNotification(session, false)
  }

  // Callbacks

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = null

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
  val notification = buildNotification(session)
    val notificationId = session.player.hashCode()
    val notificationManager: NotificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

    // Always cancel the placeholder notification once we have a real player notification
    if (!placeholderCanceled) {
      notificationManager.cancel(PLACEHOLDER_NOTIFICATION_ID)
      placeholderCanceled = true
    }

    if (startInForegroundRequired) {
      startForeground(notificationId, notification)
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager.createNotificationChannel(
          NotificationChannel(
            NOTIFICATION_CHANEL_ID,
            NOTIFICATION_CHANEL_ID,
            NotificationManager.IMPORTANCE_LOW
          )
        )
      }

      if (session.player.currentMediaItem == null) {
        notificationManager.cancel(notificationId)
        return
      }

      notificationManager.notify(notificationId, notification)
    }
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopForegroundSafely()
    cleanup()
    stopSelf()
  }

  override fun onDestroy() {
    stopForegroundSafely()
    cleanup()
    val notificationManager: NotificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.deleteNotificationChannel(NOTIFICATION_CHANEL_ID)
    }
    super.onDestroy()
  }

  private fun stopForegroundSafely() {
    try {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } catch (_: Exception) {}
  }

  private fun buildNotification(session: MediaSession): Notification {
    // Determine whether we should show full media controls or a simple background notification
    val hybridPlayer = mediaSessionsList.entries.find { it.value == session }?.key
    val showControls = hybridPlayer?.showNotificationControls == true

    val returnToPlayer = Intent(this, sourceActivity ?: this.javaClass).apply {
      flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }

    /*
     * On Android 13+ controls are automatically handled via media session
     * On Android 12 and bellow we need to add controls manually
     */
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (showControls) {
        NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
          .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
          .setStyle(MediaStyleNotificationHelper.MediaStyle(session))
          .setContentIntent(PendingIntent.getActivity(this, 0, returnToPlayer, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
          .build()
      } else {
        // Simple background notification without media controls
        NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
          .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
          .setContentTitle("${getAppName()} is playing in background")
          .setOngoing(true)
          .setContentIntent(PendingIntent.getActivity(this, 0, returnToPlayer, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
          .build()
      }
    } else {
      val playerId = session.player.hashCode()

      if (showControls) {
        // Action for COMMAND.SEEK_BACKWARD
        val seekBackwardIntent = Intent(this, VideoPlaybackService::class.java).apply {
          putExtra("PLAYER_ID", playerId)
          putExtra("ACTION", COMMAND.SEEK_BACKWARD.stringValue)
        }
        val seekBackwardPendingIntent = PendingIntent.getService(
          this,
          playerId * 10,
          seekBackwardIntent,
          PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // ACTION FOR COMMAND.TOGGLE_PLAY
        val togglePlayIntent = Intent(this, VideoPlaybackService::class.java).apply {
          putExtra("PLAYER_ID", playerId)
          putExtra("ACTION", COMMAND.TOGGLE_PLAY.stringValue)
        }
        val togglePlayPendingIntent = PendingIntent.getService(
          this,
          playerId * 10 + 1,
          togglePlayIntent,
          PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // ACTION FOR COMMAND.SEEK_FORWARD
        val seekForwardIntent = Intent(this, VideoPlaybackService::class.java).apply {
          putExtra("PLAYER_ID", playerId)
          putExtra("ACTION", COMMAND.SEEK_FORWARD.stringValue)
        }
        val seekForwardPendingIntent = PendingIntent.getService(
          this,
          playerId * 10 + 2,
          seekForwardIntent,
          PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
          // Show controls on lock screen even when user hides sensitive content.
          .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
          .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
          // Add media control buttons that invoke intents in your media service
          .addAction(androidx.media3.session.R.drawable.media3_icon_rewind, "Seek Backward", seekBackwardPendingIntent) // #0
          .addAction(
            if (session.player.isPlaying) {
              androidx.media3.session.R.drawable.media3_icon_pause
            } else {
              androidx.media3.session.R.drawable.media3_icon_play
            },
            "Toggle Play",
            togglePlayPendingIntent
          ) // #1
          .addAction(androidx.media3.session.R.drawable.media3_icon_fast_forward, "Seek Forward", seekForwardPendingIntent) // #2
          // Apply the media style template
          .setStyle(MediaStyleNotificationHelper.MediaStyle(session).setShowActionsInCompactView(0, 1, 2))
          .setContentTitle(session.player.mediaMetadata.title)
          .setContentText(session.player.mediaMetadata.description)
          .setContentIntent(PendingIntent.getActivity(this, 0, returnToPlayer, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
          .setLargeIcon(session.player.mediaMetadata.artworkUri?.let { session.bitmapLoader.loadBitmap(it).get() })
          .setOngoing(true)
          .build()
      } else {
        // Simple background notification without action controls
        NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
          .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
          .setContentTitle("${getAppName()} is playing in background")
          .setOngoing(true)
          .setContentIntent(PendingIntent.getActivity(this, 0, returnToPlayer, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
          .build()
      }
    }
  }

  private fun hidePlayerNotification(player: ExoPlayer) {
    val notificationManager: NotificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(player.hashCode())
  }

  private fun hideAllNotifications() {
    val notificationManager: NotificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancelAll()
  }

  private fun cleanup() {
    stopForegroundSafely()
    stopSelf()
    hideAllNotifications()
    mediaSessionsList.forEach { (_, session) ->
      session.release()
    }
    mediaSessionsList.clear()
    placeholderCanceled = false
  }

  // Stop the service if there are no active media sessions (no players need it)
  fun stopIfNoPlayers() {
    if (mediaSessionsList.isEmpty()) {
      cleanup()
    }
  }

  private fun createPlaceholderNotification(): Notification {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.createNotificationChannel(
        NotificationChannel(
          NOTIFICATION_CHANEL_ID,
          NOTIFICATION_CHANEL_ID,
          NotificationManager.IMPORTANCE_LOW
        )
      )
    }

    return NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
      .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
      .setContentTitle("Media playback")
      .setContentText("Preparing playback")
      .build()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !placeholderCanceled) {
      startForeground(PLACEHOLDER_NOTIFICATION_ID, createPlaceholderNotification())
    }

    intent?.let {
      val playerId = it.getIntExtra("PLAYER_ID", -1)
      val actionCommand = it.getStringExtra("ACTION")

      if (playerId < 0) {
        Log.w(TAG, "Received Command without playerId")
        return super.onStartCommand(intent, flags, startId)
      }

      if (actionCommand == null) {
        Log.w(TAG, "Received Command without action command")
        return super.onStartCommand(intent, flags, startId)
      }

      val session = mediaSessionsList.values.find { s -> s.player.hashCode() == playerId } ?: return super.onStartCommand(intent, flags, startId)

      handleCommand(commandFromString(actionCommand), session)
    }

    return START_NOT_STICKY
  }

  companion object {
    private const val SEEK_INTERVAL_MS = 10000L
    private const val TAG = "VideoPlaybackService"
    private const val PLACEHOLDER_NOTIFICATION_ID = 9999

    const val NOTIFICATION_CHANEL_ID = "RNVIDEO_SESSION_NOTIFICATION"
    const val VIDEO_PLAYBACK_SERVICE_INTERFACE = SERVICE_INTERFACE

    enum class COMMAND(val stringValue: String) {
      NONE("NONE"),
      SEEK_FORWARD("COMMAND_SEEK_FORWARD"),
      SEEK_BACKWARD("COMMAND_SEEK_BACKWARD"),
      TOGGLE_PLAY("COMMAND_TOGGLE_PLAY"),
      PLAY("COMMAND_PLAY"),
      PAUSE("COMMAND_PAUSE")
    }

    fun commandFromString(value: String): COMMAND =
      when (value) {
        COMMAND.SEEK_FORWARD.stringValue -> COMMAND.SEEK_FORWARD
        COMMAND.SEEK_BACKWARD.stringValue -> COMMAND.SEEK_BACKWARD
        COMMAND.TOGGLE_PLAY.stringValue -> COMMAND.TOGGLE_PLAY
        COMMAND.PLAY.stringValue -> COMMAND.PLAY
        COMMAND.PAUSE.stringValue -> COMMAND.PAUSE
        else -> COMMAND.NONE
      }
    fun handleCommand(command: COMMAND, session: MediaSession) {
      // TODO: get somehow ControlsConfig here - for now hardcoded 10000ms

      when (command) {
        COMMAND.SEEK_BACKWARD -> session.player.seekTo(session.player.contentPosition - SEEK_INTERVAL_MS)
        COMMAND.SEEK_FORWARD -> session.player.seekTo(session.player.contentPosition + SEEK_INTERVAL_MS)
        COMMAND.TOGGLE_PLAY -> handleCommand(if (session.player.isPlaying) COMMAND.PAUSE else COMMAND.PLAY, session)
        COMMAND.PLAY -> session.player.play()
        COMMAND.PAUSE -> session.player.pause()
        else -> Log.w(TAG, "Received COMMAND.NONE - was there an error?")
      }
    }
  }

  private fun getAppName(): String {
    return try {
      val pm = packageManager
      val label = pm.getApplicationLabel(applicationInfo)
      label.toString()
    } catch (e: Exception) {
      applicationInfo.packageName
    }
  }
}
