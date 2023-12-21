package com.brentvatne.exoplayer.events

import com.brentvatne.common.api.Track
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnAudioTracksEvent(viewTag: Int, private val audioTracks: ArrayList<Track>) : Event<OnAudioTracksEvent>(viewTag) {
    private val EVENT_PROP_AUDIO_TRACKS = "audioTracks"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnAudioTracks"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), arrayToObject(EVENT_PROP_AUDIO_TRACKS, audioTracksToArray(audioTracks)))
    }

    fun arrayToObject(field: String?, array: WritableArray?): WritableMap? {
        val event = Arguments.createMap()
        // @todo: temporarily remove put array on event callback parameter (codegen issue)
        // event.putArray(field!!, array)
        return event
    }

    fun audioTracksToArray(audioTracks: java.util.ArrayList<Track>?): WritableArray? {
        val waAudioTracks = Arguments.createArray()
        if (audioTracks != null) {
            for (i in audioTracks.indices) {
                val format = audioTracks[i]
                val audioTrack = Arguments.createMap()
                audioTrack.putInt("index", i)
                audioTrack.putString("title", if (format.title != null) format.title else "")
                audioTrack.putString("type", if (format.mimeType != null) format.mimeType else "")
                audioTrack.putString("language", if (format.language != null) format.language else "")
                audioTrack.putInt("bitrate", format.bitrate)
                audioTrack.putBoolean("selected", format.isSelected)
                waAudioTracks.pushMap(audioTrack)
            }
        }
        return waAudioTracks
    }
}
