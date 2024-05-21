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

    var live: Live = Live()

    class Live {
        var maxPlaybackSpeed: Float = BufferConfigPropUnsetDouble.toFloat()
        var minPlaybackSpeed: Float = BufferConfigPropUnsetDouble.toFloat()
        var maxOffsetMs: Long = BufferConfigPropUnsetInt.toLong()
        var minOffsetMs: Long = BufferConfigPropUnsetInt.toLong()
        var targetOffsetMs: Long = BufferConfigPropUnsetInt.toLong()

        companion object {
            private val PROP_BUFFER_CONFIG_LIVE_MAX_PLAYBACK_SPEED = "maxPlaybackSpeed"
            private val PROP_BUFFER_CONFIG_LIVE_MIN_PLAYBACK_SPEED = "minPlaybackSpeed"
            private val PROP_BUFFER_CONFIG_LIVE_MAX_OFFSET_MS = "maxOffsetMs"
            private val PROP_BUFFER_CONFIG_LIVE_MIN_OFFSET_MS = "minOffsetMs"
            private val PROP_BUFFER_CONFIG_LIVE_TARGET_OFFSET_MS = "targetOffsetMs"

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

        private val PROP_BUFFER_CONFIG_CACHE_SIZE = "cacheSizeMB"
        private val PROP_BUFFER_CONFIG_MIN_BUFFER_MS = "minBufferMs"
        private val PROP_BUFFER_CONFIG_MAX_BUFFER_MS = "maxBufferMs"
        private val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS = "bufferForPlaybackMs"
        private val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = "bufferForPlaybackAfterRebufferMs"
        private val PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT = "maxHeapAllocationPercent"
        private val PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT = "minBackBufferMemoryReservePercent"
        private val PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT = "minBufferMemoryReservePercent"
        private val PROP_BUFFER_CONFIG_BACK_BUFFER_DURATION_MS = "backBufferDurationMs"
        private val PROP_BUFFER_CONFIG_LIVE = "live"

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
                bufferConfig.live = Live.parse(src.getMap(PROP_BUFFER_CONFIG_LIVE))
            }
            return bufferConfig
        }
    }
}
