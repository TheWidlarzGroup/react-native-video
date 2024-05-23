package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.MediaStyleNotificationHelper
import androidx.media3.session.SessionCommand
import okhttp3.internal.immutableListOf

class PlaybackServiceBinder(val service: VideoPlaybackService) : Binder()

class VideoPlaybackService : MediaSessionService() {
    private var mediaSessionsList = mutableMapOf<ExoPlayer, MediaSession>()
    private var binder = PlaybackServiceBinder(this)
    private var sourceActivity: Class<Activity>? = null

    // Controls
    private val commandSeekForward = SessionCommand(COMMAND_SEEK_FORWARD, Bundle.EMPTY)
    private val commandSeekBackward = SessionCommand(COMMAND_SEEK_BACKWARD, Bundle.EMPTY)

    @SuppressLint("PrivateResource")
    private val seekForwardBtn = CommandButton.Builder()
        .setDisplayName("forward")
        .setSessionCommand(commandSeekForward)
        .setIconResId(androidx.media3.ui.R.drawable.exo_notification_fastforward)
        .build()

    @SuppressLint("PrivateResource")
    private val seekBackwardBtn = CommandButton.Builder()
        .setDisplayName("backward")
        .setSessionCommand(commandSeekBackward)
        .setIconResId(androidx.media3.ui.R.drawable.exo_notification_rewind)
        .build()

    // Player Registry

    fun registerPlayer(player: ExoPlayer, from: Class<Activity>) {
        if (mediaSessionsList.containsKey(player)) {
            return
        }
        sourceActivity = from

        val mediaSession = MediaSession.Builder(this, player)
            .setId("RNVideoPlaybackService_" + player.hashCode())
            .setCallback(VideoPlaybackCallback(SEEK_INTERVAL_MS))
            .setCustomLayout(immutableListOf(seekBackwardBtn, seekForwardBtn))
            .build()

        mediaSessionsList[player] = mediaSession
        addSession(mediaSession)
    }

    fun unregisterPlayer(player: ExoPlayer) {
        hidePlayerNotification(player)
        val session = mediaSessionsList.remove(player)
        session?.release()
        sourceActivity = null

        if (mediaSessionsList.isEmpty()) {
            cleanup()
            stopSelf()
        }
    }

    // Callbacks

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = null

    override fun onBind(intent: Intent?): IBinder {
        super.onBind(intent)
        return binder
    }

    override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
        createSessionNotification(session)
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        cleanup()
        stopSelf()
    }

    override fun onDestroy() {
        cleanup()
        super.onDestroy()
    }

    private fun createSessionNotification(session: MediaSession) {
        val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
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
            notificationManager.cancel(session.player.hashCode())
            return
        }

        val returnToPlayer = Intent(this, sourceActivity).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val notificationCompact = NotificationCompat.Builder(this, NOTIFICATION_CHANEL_ID)
            .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
            .setStyle(MediaStyleNotificationHelper.MediaStyle(session))
            .setContentIntent(PendingIntent.getActivity(this, 0, returnToPlayer, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
            .build()

        notificationManager.notify(session.player.hashCode(), notificationCompact)
    }

    private fun hidePlayerNotification(player: ExoPlayer) {
        val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(player.hashCode())
    }

    private fun hideAllNotifications() {
        val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationManager.deleteNotificationChannel(NOTIFICATION_CHANEL_ID)
        }
    }

    private fun cleanup() {
        hideAllNotifications()
        mediaSessionsList.forEach { (_, session) ->
            session.release()
        }
        mediaSessionsList.clear()
    }

    companion object {
        const val COMMAND_SEEK_FORWARD = "SEEK_FORWARD"
        const val COMMAND_SEEK_BACKWARD = "SEEK_BACKWARD"
        const val NOTIFICATION_CHANEL_ID = "RNVIDEO_SESSION_NOTIFICATION"
        const val SEEK_INTERVAL_MS = 10000L
    }
}
