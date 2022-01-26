package com.brentvatne.exoplayer;

import com.google.android.exoplayer2.Format;

public final class TrackInfo {
    public final int type;
    public final int renderIndex;
    public final int groupIndex;
    public final int trackIndex;
    public final long complexIndex;
    public final Format format;

    public TrackInfo(
            int type,
            int renderIndex,
            int groupIndex,
            int trackIndex,
            Format format
    ) {
        this.type = type;
        this.renderIndex = renderIndex;
        this.groupIndex = groupIndex;
        this.trackIndex = trackIndex;
        this.format = format;
        this.complexIndex = (((long) renderIndex) << 32) | (((long) groupIndex) << 16) | (trackIndex & 0xffffffffL);
    }

    public static int getRenderIndex(long complexIndex) {
        return (short) (complexIndex >> 32);
    }

    public static int getGroupIndex(long complexIndex) {
        return (short) (complexIndex >> 16);
    }

    public static int getTrackIndex(long complexIndex) {
        return (short) complexIndex;
    }
}
