package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetDouble
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
            }
            return bufferConfig
        }
    }
}
