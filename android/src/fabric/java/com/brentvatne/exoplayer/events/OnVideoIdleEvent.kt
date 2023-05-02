package com.brentvatne.exoplayer.events

import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoIdleEvent(viewTag: Int): Event<OnVideoIdleEvent>(viewTag) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoIdle"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), null)
    }
}