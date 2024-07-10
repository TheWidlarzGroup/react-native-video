package com.brentvatne.exoplayer

import android.content.Context
import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

class DefaultReactExoplayerConfig(context: Context) : ReactExoplayerConfig {

    private var bandWidthMeter: DefaultBandwidthMeter = DefaultBandwidthMeter.Builder(context).build()
    private var disableDisconnectError: Boolean = false
    override fun buildLoadErrorHandlingPolicy(minLoadRetryCount: Int): LoadErrorHandlingPolicy =
        if (disableDisconnectError) {
            ReactExoplayerLoadErrorHandlingPolicy(minLoadRetryCount)
        } else {
            DefaultLoadErrorHandlingPolicy(minLoadRetryCount)
        }

    override fun setDisableDisconnectError(disableDisconnectError: Boolean) {
        this.disableDisconnectError = disableDisconnectError
    }

    override fun getDisableDisconnectError(): Boolean = disableDisconnectError

    override fun getBandwidthMeter(): DefaultBandwidthMeter = bandWidthMeter
}
