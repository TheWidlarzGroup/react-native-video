package com.brentvatne.exoplayer

import androidx.media3.common.MediaItem.LiveConfiguration
import com.brentvatne.common.api.BufferConfig
import com.brentvatne.common.api.BufferConfig.Live

/**
 * Helper functions to create exoplayer configuration
 */
object ConfigurationUtils {

    /**
     * Create a media3.LiveConfiguration.Builder from parsed BufferConfig
     */
    @JvmStatic
    fun getLiveConfiguration(bufferConfig: BufferConfig): LiveConfiguration.Builder {
        val liveConfiguration = LiveConfiguration.Builder()
        val live: Live = bufferConfig.live
        if (bufferConfig.live.maxOffsetMs >= 0) {
            liveConfiguration.setMaxOffsetMs(live.maxOffsetMs)
        }
        if (bufferConfig.live.maxPlaybackSpeed >= 0) {
            liveConfiguration.setMaxPlaybackSpeed(live.maxPlaybackSpeed)
        }
        if (bufferConfig.live.targetOffsetMs >= 0) {
            liveConfiguration.setTargetOffsetMs(live.targetOffsetMs)
        }
        if (bufferConfig.live.minOffsetMs >= 0) {
            liveConfiguration.setMinOffsetMs(live.minOffsetMs)
        }
        if (bufferConfig.live.minPlaybackSpeed >= 0) {
            liveConfiguration.setMinPlaybackSpeed(live.minPlaybackSpeed)
        }
        return liveConfiguration
    }
}
