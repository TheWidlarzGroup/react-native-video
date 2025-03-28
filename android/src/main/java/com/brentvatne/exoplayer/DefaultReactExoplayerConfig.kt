package com.brentvatne.exoplayer

import android.content.Context
import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

class DefaultReactExoplayerConfig(private val context: Context, override var initialBitrate: Long? = null) : ReactExoplayerConfig {

    private var bandWidthMeter: DefaultBandwidthMeter = createBandwidthMeter(initialBitrate)

    override var disableDisconnectError: Boolean = false

    override val bandwidthMeter: DefaultBandwidthMeter
        get() = bandWidthMeter

    private fun createBandwidthMeter(bitrate: Long?): DefaultBandwidthMeter =
        DefaultBandwidthMeter.Builder(context)
            .setInitialBitrateEstimate(bitrate ?: DefaultBandwidthMeter.DEFAULT_INITIAL_BITRATE_ESTIMATE)
            .build()

    override fun setInitialBitrate(bitrate: Long) {
        if (initialBitrate == bitrate) return
        initialBitrate = bitrate
        bandWidthMeter = createBandwidthMeter(bitrate)
    }

    override fun buildLoadErrorHandlingPolicy(minLoadRetryCount: Int): LoadErrorHandlingPolicy =
        if (disableDisconnectError) {
            ReactExoplayerLoadErrorHandlingPolicy(minLoadRetryCount)
        } else {
            DefaultLoadErrorHandlingPolicy(minLoadRetryCount)
        }
}
