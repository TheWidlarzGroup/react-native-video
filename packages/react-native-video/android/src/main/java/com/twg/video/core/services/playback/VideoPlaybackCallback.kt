package com.twg.video.core.services.playback

import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.collect.ImmutableList

@OptIn(UnstableApi::class)
class VideoPlaybackCallback : MediaSession.Callback {
  // For Android 13+
  private fun buildCustomButtons(): ImmutableList<CommandButton> {
    val rewind = CommandButton.Builder()
      .setDisplayName("Rewind")
      .setSessionCommand(
        SessionCommand(
          CustomMediaNotificationProvider.Companion.COMMAND.SEEK_BACKWARD.stringValue,
          Bundle.EMPTY
        )
      )
      .setIconResId(androidx.media3.session.R.drawable.media3_icon_skip_back_10)
      .build()

    val forward = CommandButton.Builder()
      .setDisplayName("Forward")
      .setSessionCommand(
        SessionCommand(
          CustomMediaNotificationProvider.Companion.COMMAND.SEEK_FORWARD.stringValue,
          Bundle.EMPTY
        )
      )
      .setIconResId(androidx.media3.session.R.drawable.media3_icon_skip_forward_10)
      .build()

    return ImmutableList.of(rewind, forward)
  }

  override fun onConnect(session: MediaSession, controller: MediaSession.ControllerInfo): MediaSession.ConnectionResult {
    try {
      return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailablePlayerCommands(
          MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
            .add(Player.COMMAND_SEEK_FORWARD)
            .add(Player.COMMAND_SEEK_BACK)
            .build()
        ).setAvailableSessionCommands(
          MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            .add(
              SessionCommand(
                CustomMediaNotificationProvider.Companion.COMMAND.SEEK_FORWARD.stringValue,
                Bundle.EMPTY
              )
            )
            .add(
                SessionCommand(
                  CustomMediaNotificationProvider.Companion.COMMAND.SEEK_BACKWARD.stringValue,
                  Bundle.EMPTY
                )
            )
            .add(
              SessionCommand(
                CustomMediaNotificationProvider.Companion.COMMAND.TOGGLE_PLAY.stringValue,
                Bundle.EMPTY
              )
            ).build()
        ).build()
    } catch (e: Exception) {
      return MediaSession.ConnectionResult.reject()
    }
  }

  override fun onPostConnect(session: MediaSession, controller: MediaSession.ControllerInfo) {
    session.setCustomLayout(buildCustomButtons())
    super.onPostConnect(session, controller)
  }

  override fun onCustomCommand(
      session: MediaSession,
      controller: MediaSession.ControllerInfo,
      customCommand: SessionCommand,
      args: Bundle
  ): ListenableFuture<SessionResult> {
    CustomMediaNotificationProvider.Companion.handleCommand(
      CustomMediaNotificationProvider.Companion.commandFromString(
          customCommand.customAction
        ), session
      )

    return super.onCustomCommand(session, controller, customCommand, args)
  }
}
