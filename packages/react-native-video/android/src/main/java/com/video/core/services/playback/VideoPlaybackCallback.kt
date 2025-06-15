package com.video.core.services.playback

import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.ListenableFuture

@OptIn(UnstableApi::class)
class VideoPlaybackCallback : MediaSession.Callback {

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
                    VideoPlaybackService.Companion.COMMAND.SEEK_FORWARD.stringValue,
                    Bundle.EMPTY
                )
            )
            .add(
                SessionCommand(
                    VideoPlaybackService.Companion.COMMAND.SEEK_BACKWARD.stringValue,
                    Bundle.EMPTY
                )
            )
            .build()
        )
        .build()
    } catch (e: Exception) {
      return MediaSession.ConnectionResult.reject()
    }
  }

  override fun onCustomCommand(
      session: MediaSession,
      controller: MediaSession.ControllerInfo,
      customCommand: SessionCommand,
      args: Bundle
  ): ListenableFuture<SessionResult> {
      VideoPlaybackService.Companion.handleCommand(
          VideoPlaybackService.Companion.commandFromString(
              customCommand.customAction
          ), session
      )
    return super.onCustomCommand(session, controller, customCommand, args)
  }
}
