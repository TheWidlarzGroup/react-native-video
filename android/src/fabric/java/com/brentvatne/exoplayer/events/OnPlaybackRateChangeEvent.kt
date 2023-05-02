package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnPlaybackRateChangeEvent(viewTag: Int, private val rate: Float): Event<OnPlaybackRateChangeEvent>(viewTag) {
    private val EVENT_PROP_PLAYBACK_RATE = "playbackRate"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnPlaybackRateChange"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putDouble(EVENT_PROP_PLAYBACK_RATE, rate.toDouble())
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}