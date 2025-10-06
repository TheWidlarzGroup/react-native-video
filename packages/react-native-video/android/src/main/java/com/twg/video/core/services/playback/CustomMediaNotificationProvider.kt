package com.twg.video.core.services.playback

import android.content.Context
import android.app.PendingIntent
import android.content.Intent
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaSession
import com.google.common.collect.ImmutableList
import androidx.core.os.bundleOf
import android.os.Bundle
import com.margelo.nitro.NitroModules
import com.twg.video.core.LibraryError

@OptIn(UnstableApi::class)
class CustomMediaNotificationProvider(context: Context) : DefaultMediaNotificationProvider(context) {

  init {
    setSmallIcon(androidx.media3.session.R.drawable.media3_notification_small_icon)
  }

  fun getContext(): Context {
    return NitroModules.applicationContext ?: run {
      throw LibraryError.ApplicationContextNotFound
    }
  }

  override fun getNotificationContentTitle(metadata: MediaMetadata): CharSequence? {
    return metadata.title
      ?: metadata.displayTitle
      ?: metadata.subtitle
      ?: metadata.description
      ?: "${getAppName()} is playing"
  }

  override fun getNotificationContentText(metadata: MediaMetadata): CharSequence? {
    return metadata.artist
      ?: metadata.subtitle
      ?: metadata.description
  }

  companion object {
    private const val SEEK_INTERVAL_MS = 10000L
    private const val TAG = "CustomMediaNotificationProvider"

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
      val context = getContext()
      val pm = context.packageManager
      val label = pm.getApplicationLabel(context.applicationInfo)
      label.toString()
    } catch (e: Exception) {
      return "Unknown"
    }
  }

  override fun getMediaButtons(
    session: MediaSession,
    playerCommands: Player.Commands,
    mediaButtonPreferences: ImmutableList<CommandButton>,
    showPauseButton: Boolean
  ): ImmutableList<CommandButton> {
    val rewind = CommandButton.Builder()
      .setDisplayName("Rewind")
      .setSessionCommand(androidx.media3.session.SessionCommand(
        COMMAND.SEEK_BACKWARD.stringValue,
        Bundle.EMPTY
      ))
      .setIconResId(androidx.media3.session.R.drawable.media3_icon_skip_back_10)
      .setExtras(bundleOf(COMMAND_KEY_COMPACT_VIEW_INDEX to 0))
      .build()

    val toggle = CommandButton.Builder()
      .setDisplayName(if (showPauseButton) "Pause" else "Play")
      .setSessionCommand(androidx.media3.session.SessionCommand(
        COMMAND.TOGGLE_PLAY.stringValue,
        Bundle.EMPTY
      ))
      .setIconResId(
        if (showPauseButton) androidx.media3.session.R.drawable.media3_icon_pause
        else androidx.media3.session.R.drawable.media3_icon_play
      )
      .setExtras(bundleOf(COMMAND_KEY_COMPACT_VIEW_INDEX to 1))
      .build()

    val forward = CommandButton.Builder()
      .setDisplayName("Forward")
      .setSessionCommand(androidx.media3.session.SessionCommand(
        COMMAND.SEEK_FORWARD.stringValue,
        Bundle.EMPTY
      ))
      .setIconResId(androidx.media3.session.R.drawable.media3_icon_skip_forward_10)
      .setExtras(bundleOf(COMMAND_KEY_COMPACT_VIEW_INDEX to 2))
      .build()

    return ImmutableList.of(rewind, toggle, forward)
  }

  override fun addNotificationActions(
    mediaSession: MediaSession,
    mediaButtons: ImmutableList<CommandButton>,
    builder: androidx.core.app.NotificationCompat.Builder,
    actionFactory: androidx.media3.session.MediaNotification.ActionFactory
  ): IntArray {
    // Use default behavior to add actions from our custom buttons and return compact indices
    val compact = super.addNotificationActions(mediaSession, mediaButtons, builder, actionFactory)
    return if (compact.isEmpty()) intArrayOf(0, 1, 2) else compact
  }
}
