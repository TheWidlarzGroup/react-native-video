package com.brentvatne.exoplayer;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultLoadErrorHandlingPolicy;
import com.google.android.exoplayer2.upstream.LoadErrorHandlingPolicy;

public class DefaultReactExoplayerConfig implements ReactExoplayerConfig {

    private final DefaultBandwidthMeter bandwidthMeter;
    private boolean disableDisconnectError = false;

    public DefaultReactExoplayerConfig(Context context) {
        this.bandwidthMeter = new DefaultBandwidthMeter.Builder(context).build();
    }

    public LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount) {
        if (this.disableDisconnectError) {
            // Use custom error handling policy to prevent throwing an error when losing network connection
            return new ReactExoplayerLoadErrorHandlingPolicy(minLoadRetryCount);
        }
        return new DefaultLoadErrorHandlingPolicy(minLoadRetryCount);
    }

    public void setDisableDisconnectError(boolean disableDisconnectError) {
        this.disableDisconnectError = disableDisconnectError;
    }

    public boolean getDisableDisconnectError() {
        return this.disableDisconnectError;
    }

    @Override
    public DefaultBandwidthMeter getBandwidthMeter() {
        return bandwidthMeter;
    }
}
