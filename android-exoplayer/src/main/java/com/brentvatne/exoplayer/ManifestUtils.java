package com.brentvatne.exoplayer;

import androidx.annotation.Nullable;

import com.google.android.exoplayer2.source.dash.manifest.AdaptationSet;
import com.google.android.exoplayer2.source.dash.manifest.DashManifest;
import com.google.android.exoplayer2.source.dash.manifest.Period;
import com.google.android.exoplayer2.source.dash.manifest.Representation;

public class ManifestUtils {

    private ManifestUtils() {
    }

    @Nullable
    static Representation getRepresentationOf(@Nullable Object manifest, @Nullable TrackInfo track) {
        if (!(manifest instanceof DashManifest) || track == null || track.format.id == null) return null;

        DashManifest dashManifest = (DashManifest) manifest;
        for (int periodIndex = 0; periodIndex < dashManifest.getPeriodCount(); periodIndex++) {
            Period period = dashManifest.getPeriod(periodIndex);
            for (AdaptationSet adaptationSet : period.adaptationSets) {
                if (adaptationSet.type == track.type) {
                    for (Representation representation : adaptationSet.representations) {
                        if (track.format.id.equals(representation.format.id)) {
                            return representation;
                        }
                    }
                }
            }
        }
        return null;
    }
}
