package com.brentvatne.exoplayer;

// start/Dolby xCD change
import android.os.Handler;
// end/Dolby xCD change

import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.LoadErrorHandlingPolicy;

// start/Dolby xCD change
import com.google.android.exoplayer2.SimpleExoPlayer;
// end/Dolby xCD change

/**
 * Extension points to configure the Exoplayer instance
 */
public interface ReactExoplayerConfig {
    LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount);
	
	DefaultBandwidthMeter getBandwidthMeter();
	
	// start/Dolby xCD change
	void onPlayerBuilderAvailable(SimpleExoPlayer.Builder builder);
	
	void onPlayerAvailable(SimpleExoPlayer player);

    void addEventListener(Handler eventHandler, BandwidthMeter.EventListener eventListener);

    void removeEventListener(BandwidthMeter.EventListener eventListener);
    // end/Dolby xCD change
}
