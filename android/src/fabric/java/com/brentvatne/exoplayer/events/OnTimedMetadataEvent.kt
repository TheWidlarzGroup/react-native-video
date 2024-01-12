package com.brentvatne.exoplayer.events

import androidx.media3.common.Metadata
import androidx.media3.extractor.metadata.emsg.EventMessage
import androidx.media3.extractor.metadata.id3.Id3Frame
import androidx.media3.extractor.metadata.id3.TextInformationFrame
import com.brentvatne.common.api.TimedMetadata
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.ArrayList

class OnTimedMetadataEvent(viewTag: Int, private val metadata: ArrayList<TimedMetadata>): Event<OnTimedMetadataEvent>(viewTag) {
    private val EVENT_PROP_TIMED_METADATA = "metadata"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnTimedMetadata"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {

        val event = Arguments.createMap()
        // @todo: temporarily remove put array on event callback parameter (codegen issue)
        // event.putArray(EVENT_PROP_TIMED_METADATA, metadataArray)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}
