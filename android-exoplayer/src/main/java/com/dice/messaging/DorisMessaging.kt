package com.dice.messaging

import android.annotation.SuppressLint
import android.net.Uri
import androidx.media3.common.C
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
import com.dice.messaging.LiveEdgeUtils.isOnLiveEdge
import com.diceplatform.doris.Constants
import com.diceplatform.doris.DorisPlayer
import com.diceplatform.doris.ExoDoris
import com.diceplatform.doris.ExoDorisTrackSelector
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
    private val trackSelector: ExoDorisTrackSelector? get() = player.trackSelector
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

        is DiceMessage.GetPlayerVolumeMessage -> sendPlayerVolumeInfoMessage(
            request = message,
            volume = player.exoPlayer.volume
        )
        is DiceMessage.SetPlayerVolumeMessage -> setVolume(message)

        is DiceMessage.SetPlayerPositionMessage -> seekTo(message)

        is DiceMessage.GetPlayerTextTracksMessage -> {
            val textTrack = trackSelector?.getSelectedSubtitleTrack()
            val trackUri = textTrack?.run { player.getTextTrackUri(language)?.toString() }
            sendPlayerTextTracksInfoMessage(
                request = message,
                currentTrack = textTrack?.toMessagingTextTrack(trackUri),
                isEnabled = !(textTrack?.isOff ?: false)
            )
        }
        is DiceMessage.SetPlayerTextTracksMessage -> setTextTrack(message)

        is DiceMessage.GetPlayerAudioTracksMessage -> sendPlayerAudioTracksInfoMessage(
            request = message,
            currentTrack = trackSelector?.getSelectedAudioTrack()?.toMessagingAudioTrack(),
            isEnabled = true,
        )
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
        val windowStartTime = player.windowStartTime
        val oldPosition = player.currentPosition
        val newPosition = message.getSeekPosition(player.windowStartTime)
        player.seekTo(newPosition)
        sendPlayerSeekedMessage(oldPosition, newPosition)
        sendPlayerProgressMessage(
            request = message,
            currentPosition = newPosition,
            duration = player.duration,
            windowStartTime = windowStartTime
        )
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
        val setTracksInfo = message.setTextTracksInfo
        val track = if (setTracksInfo.enabled) {
            trackSelector?.getTracks()?.find { !it.isAudio && it.language == setTracksInfo.lang }
        } else {
            trackSelector?.getTracks()?.find { !it.isAudio && it.isOff }
        }

        if (track != null && !track.isSelected) {
            trackSelector?.selectTrack(track)
        }

        val selectedTrack = track ?: trackSelector?.getSelectedSubtitleTrack()
        val textTrackUri = player.getTextTrackUri(selectedTrack?.language)?.toString()
        sendPlayerTextTracksInfoMessage(
            request = message,
            currentTrack = selectedTrack?.toMessagingTextTrack(textTrackUri),
            isEnabled = selectedTrack?.isOff == false,
        )
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun setAudioTrack(message: DiceMessage.SetPlayerAudioTracksMessage) {
        val setTracksInfo = message.setAudioTracksInfo
        val track = if (setTracksInfo.enabled) {
            trackSelector?.getTracks()?.find { it.isAudio && it.id == setTracksInfo.audioTrackId }
        } else {
            trackSelector?.getTracks()?.find { it.isAudio && it.isOff }
        }

        if (track != null && !track.isSelected) {
            trackSelector?.selectTrack(track)
        }

        val selectedTrack = track ?: trackSelector?.getSelectedAudioTrack()
        sendPlayerAudioTracksInfoMessage(
            request = message,
            currentTrack = selectedTrack?.toMessagingAudioTrack(),
            isEnabled = selectedTrack?.isOff == false,
        )
    }

    override fun onPositionDiscontinuity(oldPosition: Player.PositionInfo, newPosition: Player.PositionInfo, reason: Int) {
        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
            sendPlayerSeekedMessage(oldPosition.positionMs, newPosition.positionMs)
        }
    }

    fun onProgressChanged(
        currentPosition: Long,
        duration: Long,
        windowStartTime: Long
    ) = sendPlayerProgressMessage(
        request = null,
        currentPosition = currentPosition,
        duration = duration,
        windowStartTime = windowStartTime,
    )

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
        val textTracks = getMessagingTextTracks()
        return PlayerInfo(
            id = source.nonNullId,
            type = streamType,
            title = title,
            state = getMessagingPlaybackState(playbackState),
            progress = getProgress(),
            subtitles = EnableState.ENABLED,
            availableSubtitles = textTracks,
            enabledSubtitles = textTracks.size,
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

    private fun sendPlayerProgressMessage(
        request: DiceMessage?,
        currentPosition: Long,
        duration: Long,
        windowStartTime: Long,
    ) {
        val isOnLiveEdge = if (isLive) isOnLiveEdge(currentPosition, duration) else null
        sendMessage(
            DiceMessage.PlayerProgressMessage(
                progressInfo = PlayerProgressInfo(
                    id = source.nonNullId,
                    type = streamType,
                    isAtLiveEdge = isOnLiveEdge,
                    progress = getProgress(currentPosition),
                    currentPosition = currentPosition,
                    duration = duration,
                    windowStartTime = windowStartTime,
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
                    availableTextTracks = getMessagingTextTracks(),
                    enabledTextTrack = currentTrack,
                ),
                requestMessageId = request?.messageId
            )
        )
    }

    private fun getMessagingTextTracks(): List<PlayerTextTracksInfo.TextTrack> {
        val languageUriMap = player.getTextTrackConfigurations()
            ?.filter { it.language != null }
            ?.associate { it.language to it.uri.toString() }
        return trackSelector?.getTracks()
            ?.filter { !it.isAudio }
            ?.map { track ->
                val src = track.language?.let { languageUriMap?.get(it) }
                track.toMessagingTextTrack(src)
            }
            ?: emptyList()
    }

    private fun sendPlayerAudioTracksInfoMessage(
        request: DiceMessage?,
        currentTrack: PlayerAudioTracksInfo.AudioTrack?,
        isEnabled: Boolean,
    ) {
        val availableAudioTracks = trackSelector?.getTracks()
            ?.filter { it.isAudio }
            ?.map { it.toMessagingAudioTrack() }
        sendMessage(
            DiceMessage.PlayerAudioTracksInfoMessage(
                audioTracksInfo = PlayerAudioTracksInfo(
                    enabled = isEnabled,
                    availableAudioTracks = availableAudioTracks ?: emptyList(),
                    enabledAudioTrack = currentTrack,
                ),
                requestMessageId = request?.messageId
            )
        )
    }

    private fun DorisPlayer.getTextTrackConfigurations() =
        exoPlayer?.currentMediaItem?.localConfiguration?.subtitleConfigurations

    private fun DorisPlayer.getTextTrackUri(language: String?): Uri? =
        getTextTrackConfigurations()?.find { it.language == language }?.uri
}