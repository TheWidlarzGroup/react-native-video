package com.brentvatne.exoplayer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.io.PrintWriter
import java.io.StringWriter

class OnVideoErrorEvent(
        viewTag: Int,
        private val errorString: String,
        private val exception:  Exception,
        private val errorCode: String
): Event<OnVideoErrorEvent>(viewTag) {
    private val EVENT_PROP_ERROR = "error"
    private val EVENT_PROP_ERROR_STRING = "errorString"
    private val EVENT_PROP_ERROR_EXCEPTION = "errorException"
    private val EVENT_PROP_ERROR_TRACE = "errorStackTrace"
    private val EVENT_PROP_ERROR_CODE = "errorCode"
    override fun getEventName(): String {
        return EVENT_NAME
    }

    companion object {
        const val EVENT_NAME = "topOnVideoErrorEvent"
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter?) {
        // Prepare stack trace

        // Prepare stack trace
        val sw = StringWriter()
        val pw = PrintWriter(sw)
        exception.printStackTrace(pw)
        val stackTrace = sw.toString()

        val error = Arguments.createMap()
        error.putString(EVENT_PROP_ERROR_STRING, errorString)
        error.putString(EVENT_PROP_ERROR_EXCEPTION, exception.toString())
        error.putString(EVENT_PROP_ERROR_CODE, errorCode)
        error.putString(EVENT_PROP_ERROR_TRACE, stackTrace)
        val event = Arguments.createMap()
        event.putMap(EVENT_PROP_ERROR, error)
        rctEventEmitter?.receiveEvent(viewTag, getEventName(), event)
    }
}