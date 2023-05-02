package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoBandwidthUpdateEvent(
        viewTag: Int,
        private val bitRateEstimate: Double,
        private val height: Int,
        private val width: Int,
        private val id: String
) : Event<OnVideoBandwidthUpdateEvent>(viewTag) {
    private val EVENT_PROP_BITRATE = "bitrate"
    private val EVENT_PROP_WIDTH = "width"
    private val EVENT_PROP_HEIGHT = "height"
    private val EVENT_PROP_TRACK_ID = "trackId"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoBandwidthUpdate"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putDouble(EVENT_PROP_BITRATE, bitRateEstimate)
        event.putInt(EVENT_PROP_WIDTH, width)
        event.putInt(EVENT_PROP_HEIGHT, height)
        event.putString(EVENT_PROP_TRACK_ID, id)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}