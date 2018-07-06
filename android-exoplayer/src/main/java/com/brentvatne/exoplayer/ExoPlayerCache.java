package com.brentvatne.exoplayer;

import android.content.Context;

import com.google.android.exoplayer2.upstream.cache.NoOpCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;

import java.io.File;

public class ExoPlayerCache {
    private static SimpleCache instance = null;

    protected ExoPlayerCache() {
        // Exists only to defeat instantiation.
    }

    public static SimpleCache getInstance(Context context) {
        if(instance == null) {
            instance = new SimpleCache(new File(context.getCacheDir().toString() + "/video-cache"), new NoOpCacheEvictor());
        }
        return instance;
    }

}
