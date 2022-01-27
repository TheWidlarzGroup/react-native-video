package com.brentvatne.exoplayer;

// start/Dolby xCD change
import com.google.android.exoplayer2.trackselection.ExoTrackSelection;
import com.google.android.exoplayer2.trackselection.ExoTrackSelection.Factory;
import com.google.android.exoplayer2.upstream.BandwidthMeter;
// end/Dolby xCD change
import com.google.android.exoplayer2.upstream.LoadErrorHandlingPolicy;

import javax.annotation.Nullable;

/**
 * Extension points to configure the Exoplayer instance
 */
public interface ReactExoplayerConfig {
    LoadErrorHandlingPolicy buildLoadErrorHandlingPolicy(int minLoadRetryCount);
    // start/Dolby xCD change
    BandwidthMeter getBandwidthMeter();

    @Nullable ExoTrackSelection.Factory getCustomTrackSelectionFactory();

    void onPlayerInitialized();
    // end/Dolby xCD change
}
