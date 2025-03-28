package com.brentvatne.exoplayer

import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

interface ReactExoplayerConfig {
    fun buildLoadErrorHandlingPolicy(minLoadRetryCount: Int): LoadErrorHandlingPolicy
    var disableDisconnectError: Boolean
    val bandwidthMeter: DefaultBandwidthMeter
    var initialBitrate: Long?
    fun setInitialBitrate(bitrate: Long)
}
