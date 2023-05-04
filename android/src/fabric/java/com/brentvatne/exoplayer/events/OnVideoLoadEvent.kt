package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoLoadEvent(viewTag: Int,
                       private val duration: Double,
                       private val currentPosition: Double,
                       private val videoWidth: Int,
                       private val videoHeight: Int,
                       private val audioTracks: WritableArray,
                       private val textTracks: WritableArray,
                       private val videoTracks: WritableArray,
                       private val trackId: String): Event<OnVideoLoadEvent>(viewTag) {
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
        event.putDouble(EVENT_PROP_DURATION, duration / 1000.0)
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000.0)

        val naturalSize: WritableMap? = aspectRatioToNaturalSize(videoWidth, videoHeight)
        event.putMap(EVENT_PROP_NATURAL_SIZE, naturalSize)
        event.putString(EVENT_PROP_TRACK_ID, trackId)
        event.putArray(EVENT_PROP_VIDEO_TRACKS, videoTracks)
        event.putArray(EVENT_PROP_AUDIO_TRACKS, audioTracks)
        event.putArray(EVENT_PROP_TEXT_TRACKS, textTracks)

        // TODO: Actually check if you can.

        // TODO: Actually check if you can.
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true)
        event.putBoolean(EVENT_PROP_SLOW_FORWARD, true)
        event.putBoolean(EVENT_PROP_SLOW_REVERSE, true)
        event.putBoolean(EVENT_PROP_REVERSE, true)
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true)
        event.putBoolean(EVENT_PROP_STEP_BACKWARD, true)
        event.putBoolean(EVENT_PROP_STEP_FORWARD, true)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }

    companion object {
        const val EVENT_NAME = "topOnVideoLoad"
    }

    fun aspectRatioToNaturalSize(videoWidth: Int, videoHeight: Int): WritableMap? {
        val naturalSize = Arguments.createMap()
        naturalSize.putInt(EVENT_PROP_WIDTH, videoWidth)
        naturalSize.putInt(EVENT_PROP_HEIGHT, videoHeight)
        if (videoWidth > videoHeight) {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "landscape")
        } else if (videoWidth < videoHeight) {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "portrait")
        } else {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "square")
        }
        return naturalSize
    }
}