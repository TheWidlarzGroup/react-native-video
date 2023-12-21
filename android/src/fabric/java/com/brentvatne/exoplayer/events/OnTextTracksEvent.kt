package com.brentvatne.exoplayer.events

import com.brentvatne.common.api.Track
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnTextTracksEvent(viewTag: Int, private val textTracks:  ArrayList<Track>) : Event<OnTextTracksEvent>(viewTag) {
    private val EVENT_PROP_TEXT_TRACKS = "textTracks"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnTextTracks"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), arrayToObject(EVENT_PROP_TEXT_TRACKS, textTracksToArray(textTracks)))
    }

    fun arrayToObject(field: String?, array: WritableArray?): WritableMap? {
        val event = Arguments.createMap()
        // @todo: temporarily remove put array on event callback parameter (codegen issue)
        // event.putArray(field!!, array)
        return event
    }

    fun textTracksToArray(textTracks: ArrayList<Track>?): WritableArray? {
        val waTextTracks = Arguments.createArray()
        if (textTracks != null) {
            for (i in textTracks.indices) {
                val format = textTracks[i]
                val textTrack = Arguments.createMap()
                textTrack.putInt("index", i)
                textTrack.putString("title", if (format.title != null) format.title else "")
                textTrack.putString("type", if (format.mimeType != null) format.mimeType else "")
                textTrack.putString("language", if (format.language != null) format.language else "")
                textTrack.putBoolean("selected", format.isSelected)
                waTextTracks.pushMap(textTrack)
            }
        }
        return waTextTracks
    }
}
