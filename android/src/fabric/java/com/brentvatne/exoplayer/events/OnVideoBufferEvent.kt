package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoBufferEvent(viewTag: Int, private val isBuffering: Boolean) : Event<OnVideoBufferEvent>(viewTag) {
    private val EVENT_PROP_IS_BUFFERING = "isBuffering"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoBuffer"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putBoolean(EVENT_PROP_IS_BUFFERING, isBuffering)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}