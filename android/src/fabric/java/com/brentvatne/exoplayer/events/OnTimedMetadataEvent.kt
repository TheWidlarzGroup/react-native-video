package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.android.exoplayer2.metadata.emsg.EventMessage
import com.google.android.exoplayer2.metadata.id3.Id3Frame
import com.google.android.exoplayer2.metadata.id3.TextInformationFrame

class OnTimedMetadataEvent(viewTag: Int, private val metadata: com.google.android.exoplayer2.metadata.Metadata): Event<OnTimedMetadataEvent>(viewTag) {
    private val EVENT_PROP_TIMED_METADATA = "metadata"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnTimedMetadata"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        val metadataArray = Arguments.createArray()

        for (i in 0 until metadata.length()) {
            val entry = metadata[i]
            if (entry is Id3Frame) {
                val frame = entry
                var value = ""
                if (frame is TextInformationFrame) {
                    value = frame.value
                }
                val identifier = frame.id
                val map = Arguments.createMap()
                map.putString("identifier", identifier)
                map.putString("value", value)
                metadataArray.pushMap(map)
            } else if (entry is EventMessage) {
                val eventMessage = entry
                val map = Arguments.createMap()
                map.putString("identifier", eventMessage.schemeIdUri)
                map.putString("value", eventMessage.value)
                metadataArray.pushMap(map)
            }
        }

        val event = Arguments.createMap()
        // @todo: temporarily remove put array on event callback parameter (codegen issue)
        // event.putArray(EVENT_PROP_TIMED_METADATA, metadataArray)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}