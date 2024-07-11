package com.brentvatne.exoplayer;

import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter;
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy;

/**
 * Extension points to configure the Exoplayer instance
 */
public interface ReactExoplayerConfig {
    LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount);

    void setDisableDisconnectError(boolean disableDisconnectError);
    boolean getDisableDisconnectError();

    DefaultBandwidthMeter getBandwidthMeter();
}
