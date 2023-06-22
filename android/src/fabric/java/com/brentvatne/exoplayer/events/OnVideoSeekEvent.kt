package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class OnVideoSeekEvent(viewTag: Int, private val currentPosition: Long, private val seekTime: Long, private val finished: Boolean) : Event<OnVideoSeekEvent>(viewTag) {
    private val EVENT_PROP_CURRENT_TIME = "currentTime"
    private val EVENT_PROP_SEEK_TIME = "seekTime"
    private val EVENT_PROP_FINISHED = "finished"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val event = Arguments.createMap()
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000.0)
        event.putDouble(EVENT_PROP_SEEK_TIME, seekTime / 1000.0)
        event.putBoolean(EVENT_PROP_FINISHED, finished)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }

    companion object {
        const val EVENT_NAME = "topOnVideoSeek"
    }
}