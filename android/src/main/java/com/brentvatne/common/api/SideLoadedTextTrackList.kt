package com.brentvatne.common.api

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/**
 * Class representing a list of sideLoaded text track from application
 * Do you use player import in this class
 */

class SideLoadedTextTrackList {
    var tracks = ArrayList<SideLoadedTextTrack>()

    /** return true if this and src are equals  */
    override fun equals(other: Any?): Boolean {
        if (other == null || other !is SideLoadedTextTrackList) return false
        return tracks == other.tracks
    }

    companion object {
        fun parse(src: ReadableArray?): SideLoadedTextTrackList? {
            if (src == null) {
                return null
            }
            val sideLoadedTextTrackList = SideLoadedTextTrackList()
            for (i in 0 until src.size()) {
                val textTrack: ReadableMap? = src.getMap(i)
                textTrack?.let {
                    sideLoadedTextTrackList.tracks.add(SideLoadedTextTrack.parse(it))
                }
            }
            return sideLoadedTextTrackList
        }
    }
}
