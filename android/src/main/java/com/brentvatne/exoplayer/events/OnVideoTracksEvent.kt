package com.brentvatne.exoplayer.events

import com.brentvatne.common.VideoTrack
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
        event.putArray(field!!, array)
        return event
    }

    fun videoTracksToArray(videoTracks: ArrayList<VideoTrack>?): WritableArray? {
        val waVideoTracks = Arguments.createArray()
        if (videoTracks != null) {
            for (i in videoTracks.indices) {
                val vTrack = videoTracks[i]
                val videoTrack = Arguments.createMap()
                videoTrack.putInt("width", vTrack.m_width)
                videoTrack.putInt("height", vTrack.m_height)
                videoTrack.putInt("bitrate", vTrack.m_bitrate)
                videoTrack.putString("codecs", vTrack.m_codecs)
                videoTrack.putInt("trackId", vTrack.m_id)
                videoTrack.putBoolean("selected", vTrack.m_isSelected)
                waVideoTracks.pushMap(videoTrack)
            }
        }
        return waVideoTracks
    }
}