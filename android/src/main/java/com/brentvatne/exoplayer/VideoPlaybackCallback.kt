package com.brentvatne.exoplayer

import android.os.Bundle
import androidx.media3.common.Player
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.brentvatne.exoplayer.VideoPlaybackService.Companion.COMMAND
import com.brentvatne.exoplayer.VideoPlaybackService.Companion.commandFromString
import com.brentvatne.exoplayer.VideoPlaybackService.Companion.handleCommand
import com.google.common.util.concurrent.ListenableFuture

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
                        .add(SessionCommand(COMMAND.SEEK_FORWARD.stringValue, Bundle.EMPTY))
                        .add(SessionCommand(COMMAND.SEEK_BACKWARD.stringValue, Bundle.EMPTY))
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
        handleCommand(commandFromString(customCommand.customAction), session)
        return super.onCustomCommand(session, controller, customCommand, args)
    }
}
