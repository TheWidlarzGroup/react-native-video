package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoPlaybackStateChangedEvent(viewTag: Int, private val isPlaying: Boolean) : Event<OnVideoPlaybackStateChangedEvent>(viewTag) {
    private val EVENT_PROP_IS_PLAYING = "isPlaying"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoPlaybackStateChanged"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putBoolean(EVENT_PROP_IS_PLAYING, isPlaying)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}