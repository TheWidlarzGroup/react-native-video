package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnReceiveAdEventEvent(viewTag: Int, private val event: String): Event<OnReceiveAdEventEvent>(viewTag) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnReceiveAdEventEvent"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val map = Arguments.createMap()
        map.putString("event", event)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), map)
    }
}