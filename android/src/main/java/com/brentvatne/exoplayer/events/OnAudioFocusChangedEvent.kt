package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnAudioFocusChangedEvent(viewTag: Int, private val hasFocus: Boolean): Event<OnAudioFocusChangedEvent>(viewTag) {
    private val EVENT_PROP_HAS_AUDIO_FOCUS = "hasAudioFocus"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnAudioFocusChanged"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putBoolean(EVENT_PROP_HAS_AUDIO_FOCUS, hasFocus)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}