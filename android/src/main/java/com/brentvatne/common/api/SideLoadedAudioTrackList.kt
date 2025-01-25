package com.brentvatne.common.api

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/**
 * Class representing a list of sideLoaded audio tracks from application
 * Do you use player import in this class
 */
class SideLoadedAudioTrackList {
    var tracks = ArrayList<SideLoadedAudioTrack>()

    /** return true if this and src are equals  */
    override fun equals(other: Any?): Boolean {
        if (other == null || other !is SideLoadedAudioTrackList) return false
        return tracks == other.tracks
    }

    companion object {
        fun parse(src: ReadableArray?): SideLoadedAudioTrackList? {
            if (src == null) {
                return null
            }
            val sideLoadedAudioTrackList = SideLoadedAudioTrackList()
            for (i in 0 until src.size()) {
                val audioTrack: ReadableMap? = src.getMap(i)
                audioTrack?.let {
                    sideLoadedAudioTrackList.tracks.add(SideLoadedAudioTrack.parse(it))
                }
            }
            return sideLoadedAudioTrackList
        }
    }
}