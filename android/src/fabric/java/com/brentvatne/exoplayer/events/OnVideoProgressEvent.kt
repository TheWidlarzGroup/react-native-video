package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoProgressEvent(
        viewTag: Int,
        private val currentPosition: Double,
        private val bufferedDuration: Double,
        private val seekableDuration: Double,
        private val currentPlaybackTime: Double
): Event<OnVideoProgressEvent>(viewTag) {
    private val EVENT_PROP_FAST_FORWARD = "canPlayFastForward"
    private val EVENT_PROP_SLOW_FORWARD = "canPlaySlowForward"
    private val EVENT_PROP_SLOW_REVERSE = "canPlaySlowReverse"
    private val EVENT_PROP_REVERSE = "canPlayReverse"
    private val EVENT_PROP_STEP_FORWARD = "canStepForward"
    private val EVENT_PROP_STEP_BACKWARD = "canStepBackward"

    private val EVENT_PROP_BUFFER_START = "bufferStart"
    private val EVENT_PROP_BUFFER_END = "bufferEnd"
    private val EVENT_PROP_DURATION = "duration"
    private val EVENT_PROP_PLAYABLE_DURATION = "playableDuration"
    private val EVENT_PROP_SEEKABLE_DURATION = "seekableDuration"
    private val EVENT_PROP_CURRENT_TIME = "currentTime"
    private val EVENT_PROP_CURRENT_PLAYBACK_TIME = "currentPlaybackTime"
    private val EVENT_PROP_SEEK_TIME = "seekTime"
    private val EVENT_PROP_NATURAL_SIZE = "naturalSize"
    private val EVENT_PROP_TRACK_ID = "trackId"
    private val EVENT_PROP_WIDTH = "width"
    private val EVENT_PROP_HEIGHT = "height"
    private val EVENT_PROP_ORIENTATION = "orientation"
    private val EVENT_PROP_VIDEO_TRACKS = "videoTracks"
    private val EVENT_PROP_AUDIO_TRACKS = "audioTracks"
    private val EVENT_PROP_TEXT_TRACKS = "textTracks"
    private val EVENT_PROP_HAS_AUDIO_FOCUS = "hasAudioFocus"
    private val EVENT_PROP_IS_BUFFERING = "isBuffering"
    private val EVENT_PROP_PLAYBACK_RATE = "playbackRate"

    private val EVENT_PROP_ERROR = "error"
    private val EVENT_PROP_ERROR_STRING = "errorString"
    private val EVENT_PROP_ERROR_EXCEPTION = "errorException"
    private val EVENT_PROP_ERROR_TRACE = "errorStackTrace"
    private val EVENT_PROP_ERROR_CODE = "errorCode"

    private val EVENT_PROP_TIMED_METADATA = "metadata"

    private val EVENT_PROP_BITRATE = "bitrate"

    private val EVENT_PROP_IS_PLAYING = "isPlaying"

    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000.0)
        event.putDouble(EVENT_PROP_PLAYABLE_DURATION, bufferedDuration / 1000.0)
        event.putDouble(EVENT_PROP_SEEKABLE_DURATION, seekableDuration / 1000.0)
        event.putDouble(EVENT_PROP_CURRENT_PLAYBACK_TIME, currentPlaybackTime)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }

    companion object {
        const val EVENT_NAME = "topOnVideoProgress"
    }
}