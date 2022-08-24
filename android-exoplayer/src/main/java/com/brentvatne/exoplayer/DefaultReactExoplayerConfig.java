package com.brentvatne.exoplayer;

import android.content.Context;
// start/Dolby xCD change
import android.os.Handler;
// end/Dolby xCD change
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultLoadErrorHandlingPolicy;
import com.google.android.exoplayer2.upstream.LoadErrorHandlingPolicy;
// start/Dolby xCD change
import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.SimpleExoPlayer;
// end/Dolby xCD change

public class DefaultReactExoplayerConfig implements ReactExoplayerConfig {

    private final DefaultBandwidthMeter bandwidthMeter;

    public DefaultReactExoplayerConfig(Context context) {
        this.bandwidthMeter = new DefaultBandwidthMeter.Builder(context).build();
    }

    @Override
    public LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount) {
        return new DefaultLoadErrorHandlingPolicy(minLoadRetryCount);
    }

    @Override
    public DefaultBandwidthMeter getBandwidthMeter() {
        return bandwidthMeter;
    }
    
   // start/Dolby xCD change
    @Override
    public void onPlayerBuilderAvailable(SimpleExoPlayer.Builder builder) {}

    @Override
    public void onPlayerAvailable(SimpleExoPlayer player) {}

    @Override
    public void addEventListener(Handler eventHandler, BandwidthMeter.EventListener eventListener) {}

    @Override
    public void removeEventListener(BandwidthMeter.EventListener eventListener) {}
    // end/Dolby xCD change
}
