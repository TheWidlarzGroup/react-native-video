package com.brentvatne.common.api

import com.brentvatne.common.react.VideoEventEmitter

// RNVPlayerInterface is an abstraction of a player implementation
// It allows to use player in a generic code
interface RNVPlayerInterface {
    // return true if playback is muted

    val isMuted: Boolean

    // return true if playback is ongoing and false when paused
    val isPlaying: Boolean

    // return the eventEmitter associated to the player
    val eventEmitter: VideoEventEmitter

    // pause player
    fun pausePlayback()

    // decrease audio volume internally to handle audio ducking request
    fun audioDuck()

    // decrease audio volume internally from ducking request
    fun audioRestoreFromDuck()
}
