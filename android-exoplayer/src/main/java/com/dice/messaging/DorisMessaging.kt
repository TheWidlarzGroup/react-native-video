package com.dice.messaging

import android.annotation.SuppressLint
import androidx.media3.common.C
import androidx.media3.common.C.TRACK_TYPE_AUDIO
import androidx.media3.common.C.TRACK_TYPE_TEXT
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.Player.Listener
import com.dice.dicemessaging.DiceMessage
import com.dice.dicemessaging.DiceMessagingService
import com.dice.dicemessaging.EnableState
import com.dice.dicemessaging.PlaybackState
import com.dice.dicemessaging.PlayerAudioTracksInfo
import com.dice.dicemessaging.PlayerErrorInfo
import com.dice.dicemessaging.PlayerInfo
import com.dice.dicemessaging.PlayerProgressInfo
import com.dice.dicemessaging.PlayerReadyInfo
import com.dice.dicemessaging.PlayerSeekInfo
import com.dice.dicemessaging.PlayerState
import com.dice.dicemessaging.PlayerTextTracksInfo
import com.dice.dicemessaging.StreamType
import com.diceplatform.doris.Constants
import com.diceplatform.doris.ExoDoris
import com.diceplatform.doris.custom.utils.LiveEdgeUtils.isOnLiveEdge
import com.diceplatform.doris.entity.Source
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.plus

class DorisMessaging(
    private val player: ExoDoris,
    private val source: Source,
) : Listener {
    private val messageScope = MainScope() + CoroutineName("DorisMessaging")
    var isLive: Boolean = false
    var title: String? = null

    init {
        player.addListener(this)
        DiceMessagingService.messageFlow
            .onEach { onReceiveMessage(it) }
            .launchIn(messageScope)
    }

    private fun onReceiveMessage(message: DiceMessage) = when (message) {
        is DiceMessage.GetPlayerInfoMessage -> sendPlayerInfoMessage(message)

        is DiceMessage.PlayVideoMessage -> play(message)
        is DiceMessage.PauseVideoMessage -> pause(message)

        is DiceMessage.GetPlayerVolumeMessage -> sendPlayerVolumeInfoMessage(message, volume = player.exoPlayer.volume)
        is DiceMessage.SetPlayerVolumeMessage -> setVolume(message)

        is DiceMessage.SetPlayerPositionMessage -> seekTo(message)

        is DiceMessage.GetPlayerTextTracksMessage -> sendPlayerTextTracksInfoMessage(message, player.getSelectedMessagingTextTrack(), isTextTrackEnabled())
        is DiceMessage.SetPlayerTextTracksMessage -> setTextTrack(message)

        is DiceMessage.GetPlayerAudioTracksMessage -> sendPlayerAudioTracksInfoMessage(message, player.getSelectedMessagingAudioTrack(), isAudioTrackEnabled())
        is DiceMessage.SetPlayerAudioTracksMessage -> setAudioTrack(message)

        is DiceMessage.MutePlayer -> setVolume(message, volume = 0F)
        is DiceMessage.UnMutePlayer -> setVolume(message, volume = 1F)

        else -> {}
    }

    private fun pause(request: DiceMessage) {
        player.pause()
        sendPlayerPausedMessage(request)
    }

    private fun play(request: DiceMessage) {
        player.play()
        sendPlayerPlayingMessage(request)
    }

    private fun setVolume(message: DiceMessage.SetPlayerVolumeMessage) = setVolume(message, message.setVolumePayload.volume)
    private fun setVolume(message: DiceMessage, volume: Float) {
        player.setVolume(volume)
        sendPlayerVolumeInfoMessage(message, volume)
    }

    private fun seekTo(message: DiceMessage.SetPlayerPositionMessage) {
        val oldPosition = player.currentPosition
        val newPosition = message.getSeekPosition(player.windowStartTime)
        player.seekTo(newPosition)
        sendPlayerSeekedMessage(oldPosition, newPosition)
        sendPlayerProgressMessage(message, newPosition)
    }

    private fun DiceMessage.SetPlayerPositionMessage.getSeekPosition(windowStartTimeMs: Long): Long {
        val timestamp = setPositionPayload.timestamp ?: 0
        if (windowStartTimeMs == C.TIME_UNSET || !Constants.isValidTimeStamp(timestamp)) {
            return setPositionPayload.position
        }

        return timestamp - windowStartTimeMs
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun setTextTrack(message: DiceMessage.SetPlayerTextTracksMessage) {
        val setTrackInfo = message.setTextTracksInfo
        if (setTrackInfo.enabled) {
            val track = setTrackInfo.lang
                ?.let { player.findTextTrackFormat(it) }
                ?.toMediaTextTrack(true)
            if (track != null) {
                player.selectTrack(track)
            }
            val messagingTrack = track
                ?.toMessagingTextTrack(player.getTextTrackUri(track.language)?.toString())
                ?: player.getSelectedMessagingTextTrack()
            sendPlayerTextTracksInfoMessage(request = message, currentTrack = messagingTrack, isEnabled = true)
        } else {
            val parameters = player.trackSelector?.parameters
            val offTextTrack = createOffTextTrack()
            if (parameters != null) {
                val currentDisabled = parameters.disabledTrackTypes.contains(TRACK_TYPE_TEXT)
                if (!currentDisabled) {
                    player.selectTrack(offTextTrack)
                }
            }
            val messagingTrack = offTextTrack.toMessagingTextTrack(player.getTextTrackUri(offTextTrack.language)?.toString())
            sendPlayerTextTracksInfoMessage(request = message, currentTrack = messagingTrack, isEnabled = false)
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun setAudioTrack(message: DiceMessage.SetPlayerAudioTracksMessage) {
        val setTracksInfo = message.setAudioTracksInfo
        if (setTracksInfo.enabled) {
            val track = setTracksInfo.audioTrackId
                ?.let { player.findAudioTrackFormat(it) }
                ?.toMediaAudioTrack(true)
            if (track != null) {
                player.selectTrack(track)
            }

            val messagingTrack = track?.toMessagingAudioTrack(setTracksInfo.audioTrackId ?: "")
                ?: player.getSelectedMessagingAudioTrack()
            sendPlayerAudioTracksInfoMessage(request = message, currentTrack = messagingTrack, isEnabled = true)
        } else {
            val parameters = player.trackSelector?.parameters
            if (parameters != null) {
                val currentDisabled = parameters.disabledTrackTypes.contains(TRACK_TYPE_AUDIO)
                if (!currentDisabled) {
                    val offAudioTrack = createOffAudioTrack()
                    player.selectTrack(offAudioTrack)
                    sendPlayerAudioTracksInfoMessage(request = message, currentTrack = null, isEnabled = false)
                    return
                }
            }

            val messagingTrack = player.getSelectedMessagingAudioTrack()
            sendPlayerAudioTracksInfoMessage(request = message, currentTrack = messagingTrack, isEnabled = false)
        }
    }

    override fun onPositionDiscontinuity(oldPosition: Player.PositionInfo, newPosition: Player.PositionInfo, reason: Int) {
        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
            sendPlayerSeekedMessage(oldPosition.positionMs, newPosition.positionMs)
        }
    }

    fun onProgressChanged(currentPosition: Long) = sendPlayerProgressMessage(request = null, currentPosition = currentPosition)

    override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_READY) {
            sendMessage(DiceMessage.VideoLoadedMessage(composePlayerInfo()))
            sendMessage(
                DiceMessage.PlayerReadyMessage(
                    PlayerReadyInfo(
                        id = source.nonNullId,
                        type = streamType,
                        duration = player.duration.toString(),
                    )
                )
            )
        } else if (playbackState == Player.STATE_BUFFERING) {
            sendMessage(DiceMessage.PlayerBufferMessage(composePlayerState(playbackState)))
        } else if (playbackState == Player.STATE_ENDED) {
            sendMessage(DiceMessage.PlayerEndedMessage(composePlayerState(playbackState)))
        }
    }

    override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
        if (player.playbackState == Player.STATE_READY) {
            if (playWhenReady) {
                sendPlayerPlayingMessage(request = null)
            } else {
                sendPlayerPausedMessage(request = null)
            }
        }
    }

    override fun onVolumeChanged(volume: Float) = sendPlayerVolumeInfoMessage(request = null, volume = volume)
    override fun onPlayerError(error: PlaybackException) {
        sendMessage(DiceMessage.PlayerErrorMessage(PlayerErrorInfo(error.errorCodeName, error.message)))
    }

    private fun sendMessage(message: DiceMessage) = DiceMessagingService.sendMessageAsync(message)

    fun release() {
        player.removeListener(this)
        messageScope.cancel()
        sendMessage(DiceMessage.PlayerExitMessage())
    }

    private fun composePlayerInfo(playbackState: Int = player.playbackState): PlayerInfo {
        val textTracks = player.getMessagingTextTracks()
        return PlayerInfo(
            id = source.nonNullId,
            type = streamType,
            title = title,
            state = getMessagingPlaybackState(playbackState),
            progress = getProgress(),
            subtitles = EnableState.ENABLED,
            availableSubtitles = textTracks,
            enabledSubtitles = textTracks?.size,
            pip = false,
        )
    }

    private fun composePlayerState(playbackState: Int = player.playbackState) = composePlayerState(getMessagingPlaybackState(playbackState))
    private fun composePlayerState(state: String) = PlayerState(
        id = source.nonNullId,
        type = streamType,
        state = state,
        progress = getProgress(),
    )

    private fun getMessagingPlaybackState(playbackState: Int = player.playbackState): String {
        return when (playbackState) {
            Player.STATE_ENDED -> PlaybackState.ENDED
            Player.STATE_BUFFERING -> PlaybackState.BUFFERING
            Player.STATE_IDLE -> PlaybackState.IDLE
            Player.STATE_READY -> if (player.exoPlayer.isPlaying) PlaybackState.PLAYING else PlaybackState.PAUSED
            else -> PlaybackState.IDLE
        }
    }

    private fun getProgress(positionMs: Long = player.currentPosition): Float? {
        val duration = player.duration
        return if (duration > 0) positionMs.toFloat() / duration else null
    }


    private val Source.nonNullId: String get() = id ?: ""
    private val streamType: String get() = StreamType.getType(isLive)

    private fun isTextTrackEnabled() = !player.isTrackTypeDisabled(TRACK_TYPE_TEXT)
    private fun isAudioTrackEnabled() = !player.isTrackTypeDisabled(TRACK_TYPE_AUDIO)

    private fun sendPlayerInfoMessage(request: DiceMessage) = sendMessage(
        DiceMessage.PlayerInfoMessage(
            playerInfo = composePlayerInfo(),
            requestMessageId = request.messageId,
        )
    )

    private fun sendPlayerPlayingMessage(request: DiceMessage?) = sendMessage(
        DiceMessage.PlayerPlayingMessage(
            playerState = composePlayerState(PlaybackState.PLAYING),
            requestMessageId = request?.messageId,
        )
    )

    private fun sendPlayerPausedMessage(request: DiceMessage?) = sendMessage(
        DiceMessage.PlayerPausedMessage(
            playerState = composePlayerState(PlaybackState.PAUSED),
            requestMessageId = request?.messageId,
        )
    )

    private fun sendPlayerVolumeInfoMessage(request: DiceMessage?, volume: Float) = sendMessage(
        DiceMessage.PlayerVolumeInfoMessage(
            volume = volume,
            requestMessageId = request?.messageId,
        )
    )

    private fun sendPlayerControlsStateMessage(request: DiceMessage?, enabled: Boolean) = sendMessage(
        DiceMessage.PlayerControlsStateMessage(
            state = EnableState.getState(enabled),
            requestMessageId = request?.messageId,
        )
    )

    private fun sendPlayerSeekedMessage(oldPosition: Long, newPosition: Long) = sendMessage(
        DiceMessage.PlayerSeekedMessage(
            PlayerSeekInfo(
                id = source.nonNullId,
                type = streamType,
                from = oldPosition.toString(),
                to = newPosition.toString(),
            )
        )
    )

    private fun sendPlayerProgressMessage(request: DiceMessage?, currentPosition: Long) {
        val duration = player.duration
        val isOnLiveEdge = if (isLive) isOnLiveEdge(currentPosition, duration) else null
        sendMessage(
            DiceMessage.PlayerProgressMessage(
                progressInfo = PlayerProgressInfo(
                    id = source.nonNullId,
                    type = streamType,
                    isAtLiveEdge = isOnLiveEdge,
                    progress = getProgress(currentPosition),
                    dateTime = null,
                ),
                requestMessageId = request?.messageId
            )
        )
    }

    private fun sendPlayerFullScreenStateMessage(request: DiceMessage?, isFullScreen: Boolean) {
        sendMessage(
            DiceMessage.PlayerFullScreenStateMessage(
                isFullScreen = isFullScreen,
                requestMessageId = request?.messageId
            )
        )
    }

    private fun sendPlayerTextTracksInfoMessage(
        request: DiceMessage?,
        currentTrack: PlayerTextTracksInfo.TextTrack?,
        isEnabled: Boolean,
    ) {
        sendMessage(
            DiceMessage.PlayerTextTracksInfoMessage(
                textTracksInfo = PlayerTextTracksInfo(
                    enabled = isEnabled,
                    availableTextTracks = player.getMessagingTextTracks(),
                    enabledTextTrack = currentTrack,
                ),
                requestMessageId = request?.messageId
            )
        )
    }

    private fun sendPlayerAudioTracksInfoMessage(
        request: DiceMessage?,
        currentTrack: PlayerAudioTracksInfo.AudioTrack?,
        isEnabled: Boolean,
    ) {
        sendMessage(
            DiceMessage.PlayerAudioTracksInfoMessage(
                audioTracksInfo = PlayerAudioTracksInfo(
                    enabled = isEnabled,
                    availableAudioTracks = player.getMessagingAudioTracks(),
                    enabledAudioTrack = currentTrack,
                ),
                requestMessageId = request?.messageId
            )
        )
    }
}