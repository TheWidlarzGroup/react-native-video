package com.brentvatne.common.api

import android.net.Uri
import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

/**
 * Class representing a sideLoaded text track from application
 * Do you use player import in this class
 */
class SideLoadedTextTrack {
    var language: String? = null
    var title: String? = null
    var uri: Uri = Uri.EMPTY
    var type: String? = null
    companion object {
        val SIDELOAD_TEXT_TRACK_LANGUAGE = "language"
        val SIDELOAD_TEXT_TRACK_TITLE = "title"
        val SIDELOAD_TEXT_TRACK_URI = "uri"
        val SIDELOAD_TEXT_TRACK_TYPE = "type"

        fun parse(src: ReadableMap?): SideLoadedTextTrack {
            val sideLoadedTextTrack = SideLoadedTextTrack()
            if (src == null) {
                return sideLoadedTextTrack
            }
            sideLoadedTextTrack.language = ReactBridgeUtils.safeGetString(src, SIDELOAD_TEXT_TRACK_LANGUAGE)
            sideLoadedTextTrack.title = ReactBridgeUtils.safeGetString(src, SIDELOAD_TEXT_TRACK_TITLE, "")
            sideLoadedTextTrack.uri = Uri.parse(ReactBridgeUtils.safeGetString(src, SIDELOAD_TEXT_TRACK_URI, ""))
            sideLoadedTextTrack.type = ReactBridgeUtils.safeGetString(src, SIDELOAD_TEXT_TRACK_TYPE, "")
            return sideLoadedTextTrack
        }
    }
}
