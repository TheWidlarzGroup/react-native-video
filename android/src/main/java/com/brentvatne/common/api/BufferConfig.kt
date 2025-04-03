package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetDouble
import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetFloat
import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetInt
import com.facebook.react.bridge.ReadableMap

/**
 * Class representing bufferConfig for host.
 * Only generic code here, no reference to the player.
 * By default, if application don't provide input field, -1 is set instead
 */
class BufferConfig {
    var cacheSize = BufferConfigPropUnsetInt
    var minBufferMs = BufferConfigPropUnsetInt
    var maxBufferMs = BufferConfigPropUnsetInt
    var bufferForPlaybackMs = BufferConfigPropUnsetInt
    var bufferForPlaybackAfterRebufferMs = BufferConfigPropUnsetInt
    var backBufferDurationMs = BufferConfigPropUnsetInt
    var maxHeapAllocationPercent = BufferConfigPropUnsetDouble
    var minBackBufferMemoryReservePercent = BufferConfigPropUnsetDouble
    var minBufferMemoryReservePercent = BufferConfigPropUnsetDouble
    var initialBitrate = BufferConfigPropUnsetInt

    var live: Live = Live()

    /** return true if this and src are equals  */
    override fun equals(other: Any?): Boolean {
        if (other == null || other !is BufferConfig) return false
        return (
            cacheSize == other.cacheSize &&
                minBufferMs == other.minBufferMs &&
                maxBufferMs == other.maxBufferMs &&
                bufferForPlaybackMs == other.bufferForPlaybackMs &&
                bufferForPlaybackAfterRebufferMs == other.bufferForPlaybackAfterRebufferMs &&
                backBufferDurationMs == other.backBufferDurationMs &&
                maxHeapAllocationPercent == other.maxHeapAllocationPercent &&
                minBackBufferMemoryReservePercent == other.minBackBufferMemoryReservePercent &&
                minBufferMemoryReservePercent == other.minBufferMemoryReservePercent &&
                initialBitrate == other.initialBitrate &&
                live == other.live
            )
    }

    class Live {
        var maxPlaybackSpeed: Float = BufferConfigPropUnsetDouble.toFloat()
        var minPlaybackSpeed: Float = BufferConfigPropUnsetDouble.toFloat()
        var maxOffsetMs: Long = BufferConfigPropUnsetInt.toLong()
        var minOffsetMs: Long = BufferConfigPropUnsetInt.toLong()
        var targetOffsetMs: Long = BufferConfigPropUnsetInt.toLong()

        override fun equals(other: Any?): Boolean {
            if (other == null || other !is Live) return false
            return (
                maxPlaybackSpeed == other.maxPlaybackSpeed &&
                    minPlaybackSpeed == other.minPlaybackSpeed &&
                    maxOffsetMs == other.maxOffsetMs &&
                    minOffsetMs == other.minOffsetMs &&
                    targetOffsetMs == other.targetOffsetMs
                )
        }

        companion object {
            private const val PROP_BUFFER_CONFIG_LIVE_MAX_PLAYBACK_SPEED = "maxPlaybackSpeed"
            private const val PROP_BUFFER_CONFIG_LIVE_MIN_PLAYBACK_SPEED = "minPlaybackSpeed"
            private const val PROP_BUFFER_CONFIG_LIVE_MAX_OFFSET_MS = "maxOffsetMs"
            private const val PROP_BUFFER_CONFIG_LIVE_MIN_OFFSET_MS = "minOffsetMs"
            private const val PROP_BUFFER_CONFIG_LIVE_TARGET_OFFSET_MS = "targetOffsetMs"

            @JvmStatic
            fun parse(src: ReadableMap?): Live {
                val live = Live()
                live.maxPlaybackSpeed = safeGetFloat(src, PROP_BUFFER_CONFIG_LIVE_MAX_PLAYBACK_SPEED, BufferConfigPropUnsetDouble.toFloat())
                live.minPlaybackSpeed = safeGetFloat(src, PROP_BUFFER_CONFIG_LIVE_MIN_PLAYBACK_SPEED, BufferConfigPropUnsetDouble.toFloat())
                live.maxOffsetMs = safeGetInt(src, PROP_BUFFER_CONFIG_LIVE_MAX_OFFSET_MS, BufferConfigPropUnsetInt).toLong()
                live.minOffsetMs = safeGetInt(src, PROP_BUFFER_CONFIG_LIVE_MIN_OFFSET_MS, BufferConfigPropUnsetInt).toLong()
                live.targetOffsetMs = safeGetInt(src, PROP_BUFFER_CONFIG_LIVE_TARGET_OFFSET_MS, BufferConfigPropUnsetInt).toLong()
                return live
            }
        }
    }

    companion object {
        val BufferConfigPropUnsetInt = -1
        val BufferConfigPropUnsetDouble = -1.0

        private const val PROP_BUFFER_CONFIG_CACHE_SIZE = "cacheSizeMB"
        private const val PROP_BUFFER_CONFIG_MIN_BUFFER_MS = "minBufferMs"
        private const val PROP_BUFFER_CONFIG_MAX_BUFFER_MS = "maxBufferMs"
        private const val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS = "bufferForPlaybackMs"
        private const val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = "bufferForPlaybackAfterRebufferMs"
        private const val PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT = "maxHeapAllocationPercent"
        private const val PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT = "minBackBufferMemoryReservePercent"
        private const val PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT = "minBufferMemoryReservePercent"
        private const val PROP_BUFFER_CONFIG_BACK_BUFFER_DURATION_MS = "backBufferDurationMs"
        private const val PROP_BUFFER_CONFIG_INITIAL_BITRATE = "initialBitrate"
        private const val PROP_BUFFER_CONFIG_LIVE = "live"

        @JvmStatic
        fun parse(src: ReadableMap?): BufferConfig {
            val bufferConfig = BufferConfig()

            if (src != null) {
                bufferConfig.cacheSize = safeGetInt(src, PROP_BUFFER_CONFIG_CACHE_SIZE, BufferConfigPropUnsetInt)
                bufferConfig.minBufferMs = safeGetInt(src, PROP_BUFFER_CONFIG_MIN_BUFFER_MS, BufferConfigPropUnsetInt)
                bufferConfig.maxBufferMs = safeGetInt(src, PROP_BUFFER_CONFIG_MAX_BUFFER_MS, BufferConfigPropUnsetInt)
                bufferConfig.bufferForPlaybackMs = safeGetInt(src, PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS, BufferConfigPropUnsetInt)
                bufferConfig.bufferForPlaybackAfterRebufferMs =
                    safeGetInt(src, PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS, BufferConfigPropUnsetInt)
                bufferConfig.maxHeapAllocationPercent =
                    safeGetDouble(src, PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT, BufferConfigPropUnsetDouble)
                bufferConfig.minBackBufferMemoryReservePercent = safeGetDouble(
                    src,
                    PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT,
                    BufferConfigPropUnsetDouble
                )
                bufferConfig.minBufferMemoryReservePercent =
                    safeGetDouble(
                        src,
                        PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT,
                        BufferConfigPropUnsetDouble
                    )
                bufferConfig.backBufferDurationMs = safeGetInt(src, PROP_BUFFER_CONFIG_BACK_BUFFER_DURATION_MS, BufferConfigPropUnsetInt)
                bufferConfig.initialBitrate = safeGetInt(src, PROP_BUFFER_CONFIG_INITIAL_BITRATE, BufferConfigPropUnsetInt)
                bufferConfig.live = Live.parse(src.getMap(PROP_BUFFER_CONFIG_LIVE))
            }
            return bufferConfig
        }
    }
}
