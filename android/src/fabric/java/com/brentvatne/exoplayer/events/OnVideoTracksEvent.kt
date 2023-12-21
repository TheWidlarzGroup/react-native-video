package com.brentvatne.exoplayer.events

import com.brentvatne.common.api.VideoTrack
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoTracksEvent(viewTag: Int, private val videoTracks: ArrayList<VideoTrack>) : Event<OnVideoTracksEvent>(viewTag) {
    private val EVENT_PROP_VIDEO_TRACKS = "videoTracks"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoTracks"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), arrayToObject(EVENT_PROP_VIDEO_TRACKS, videoTracksToArray(videoTracks)))
    }

    fun arrayToObject(field: String?, array: WritableArray?): WritableMap? {
        val event = Arguments.createMap()
        // @todo: temporarily remove put array on event callback parameter (codegen issue)
        // event.putArray(field!!, array)
        return event
    }

    fun videoTracksToArray(videoTracks: ArrayList<VideoTrack>?): WritableArray? {
        val waVideoTracks = Arguments.createArray()
        if (videoTracks != null) {
            for (i in videoTracks.indices) {
                val vTrack = videoTracks[i]
                val videoTrack = Arguments.createMap()
                videoTrack.putInt("width", vTrack.width)
                videoTrack.putInt("height", vTrack.height)
                videoTrack.putInt("bitrate", vTrack.bitrate)
                videoTrack.putString("codecs", vTrack.codecs)
                videoTrack.putInt("trackId", vTrack.id)
                videoTrack.putBoolean("selected", vTrack.isSelected)
                waVideoTracks.pushMap(videoTrack)
            }
        }
        return waVideoTracks
    }
}
