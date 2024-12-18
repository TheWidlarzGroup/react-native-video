package androidx.media3.exoplayer.dash.manifest;

import androidx.media3.common.Format;

public class Representation {
    public Format format;
    public long presentationTimeOffsetUs;

    public Representation() {
        format = null;
    }
}
