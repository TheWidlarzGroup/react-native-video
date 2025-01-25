package com.brentvatne.common.api

import android.net.Uri
import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

/**
* Class representing a sideLoaded audio track from application
*/
class SideLoadedAudioTrack {
   var url: Uri = Uri.EMPTY
   var title: String? = null
   var language: String? = null
   var sampleMimeType: String? = null

   companion object {
       val SIDELOAD_AUDIO_TRACK_URL = "url"
       val SIDELOAD_AUDIO_TRACK_TITLE = "title"
       val SIDELOAD_AUDIO_TRACK_LANGUAGE = "language"
       val SIDELOAD_AUDIO_TRACK_SAMPLE_MIME_TYPE = "sampleMimeType"

       fun parse(src: ReadableMap?): SideLoadedAudioTrack {
            val sideLoadedAudioTrack = SideLoadedAudioTrack()
            if (src == null) {
                return sideLoadedAudioTrack
            }
            sideLoadedAudioTrack.url = Uri.parse(ReactBridgeUtils.safeGetString(src, SIDELOAD_AUDIO_TRACK_URL, ""))
            sideLoadedAudioTrack.title = ReactBridgeUtils.safeGetString(src, SIDELOAD_AUDIO_TRACK_TITLE, "")
            sideLoadedAudioTrack.language = ReactBridgeUtils.safeGetString(src, SIDELOAD_AUDIO_TRACK_LANGUAGE, "")
            sideLoadedAudioTrack.sampleMimeType = ReactBridgeUtils.safeGetString(src, SIDELOAD_AUDIO_TRACK_SAMPLE_MIME_TYPE, "")
            return sideLoadedAudioTrack
        }
    }
}