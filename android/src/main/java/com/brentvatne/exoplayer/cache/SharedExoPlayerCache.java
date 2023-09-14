package com.brentvatne.exoplayer.cache;


import android.content.Context;
import android.util.Log;

import com.google.android.exoplayer2.database.StandaloneDatabaseProvider;
import com.google.android.exoplayer2.upstream.cache.LeastRecentlyUsedCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;

import java.io.File;

public class SharedExoPlayerCache {

    private static SimpleCache simpleCache;
    private static final long exoPlayerCacheSize = 2000 * 1024 * 1024;
    private static final String TAG = "SharedExoPlayerCache";

    public static void initCache(Context context) {
        LeastRecentlyUsedCacheEvictor leastRecentlyUsedCacheEvictor = new LeastRecentlyUsedCacheEvictor(exoPlayerCacheSize);
        StandaloneDatabaseProvider exoDatabaseProvider = new StandaloneDatabaseProvider(context);
        File cacheFolder = new File(context.getCacheDir().getAbsolutePath() + "/exoplayer/");
        Log.d(TAG, "initCache() " + cacheFolder.getAbsolutePath());
        simpleCache = new SimpleCache(cacheFolder, leastRecentlyUsedCacheEvictor, exoDatabaseProvider);
    }

    public static SimpleCache getCache() {
        Log.d(TAG, "getCache()");
        return simpleCache;
    }

}