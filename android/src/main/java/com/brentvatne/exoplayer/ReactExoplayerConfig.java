package com.brentvatne.exoplayer;

import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.LoadErrorHandlingPolicy;

/**
 * Extension points to configure the Exoplayer instance
 */
public interface ReactExoplayerConfig {
    LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount);

    void setDisableDisconnectError(boolean disableDisconnectError);
    boolean getDisableDisconnectError();

    DefaultBandwidthMeter getBandwidthMeter();
}
