package com.brentvatne.exoplayer.events

import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoLoadStartEvent(viewTag: Int) : Event<OnVideoLoadStartEvent>(viewTag) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), null)
    }

    companion object {
        const val EVENT_NAME = "topOnVideoLoadStart"
    }
}