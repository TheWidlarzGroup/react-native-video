package com.dice.messaging

object LiveEdgeUtils {

    private var liveBufferRangeStartMs = 25_000
    private var liveBufferRangeEndMs = 35_000
    private var isOnLiveEdge = false

    private var dvrStartRangeStartMs = 10_000
    private var dvrStartRangeEndMs = 20_000
    private var isOnDvrStart = false

    @JvmStatic
    fun isOnLiveEdge(position: Long, duration: Long): Boolean {
        val offset = duration - position
        if (offset < liveBufferRangeStartMs) {
            isOnLiveEdge = true
        } else if (offset > liveBufferRangeEndMs) {
            isOnLiveEdge = false
        }
        return isOnLiveEdge
    }

    @JvmStatic
    fun isOnDvrStart(position: Long): Boolean {
        if (position < dvrStartRangeStartMs) {
            isOnDvrStart = true
        } else if (position > dvrStartRangeEndMs) {
            isOnDvrStart = false
        }
        return isOnDvrStart
    }
}
