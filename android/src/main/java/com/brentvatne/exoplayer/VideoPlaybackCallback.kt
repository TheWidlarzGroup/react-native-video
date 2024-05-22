package com.brentvatne.exoplayer

import android.os.Bundle
import androidx.media3.common.Player
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.ListenableFuture

class VideoPlaybackCallback(private val seekIntervalMS: Long) : MediaSession.Callback {
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
                        .add(SessionCommand(VideoPlaybackService.COMMAND_SEEK_FORWARD, Bundle.EMPTY))
                        .add(SessionCommand(VideoPlaybackService.COMMAND_SEEK_BACKWARD, Bundle.EMPTY))
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
        when (customCommand.customAction) {
            VideoPlaybackService.COMMAND_SEEK_FORWARD -> session.player.seekTo(session.player.contentPosition + seekIntervalMS)
            VideoPlaybackService.COMMAND_SEEK_BACKWARD -> session.player.seekTo(session.player.contentPosition - seekIntervalMS)
        }
        return super.onCustomCommand(session, controller, customCommand, args)
    }
}
