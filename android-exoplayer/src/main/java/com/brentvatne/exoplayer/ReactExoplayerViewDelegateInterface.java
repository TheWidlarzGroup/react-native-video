package com.brentvatne.exoplayer;

import android.net.Uri;

import com.google.android.exoplayer2.source.MediaSource;

import java.util.Map;

public interface ReactExoplayerViewDelegateInterface {
    public MediaSource buildMediaSource(ReactExoplayerView reactExoplayerView, Uri uri, String overrideExtension);

    public Uri getSrcUri(ReactExoplayerView reactExoplayerView, Uri uri);
}
