package androidx.media3.exoplayer.dash.manifest;

import androidx.collection.CircularArray;
import androidx.media3.common.C;

public class AdaptationSet {
    public int type = 0;
    public CircularArray<Representation> representations;

    public AdaptationSet() {
        representations = null;
    }
}
