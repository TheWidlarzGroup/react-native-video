package com.brentvatne.exoplayer.cache;


import android.content.Context;

import com.google.android.exoplayer2.database.StandaloneDatabaseProvider;
import com.google.android.exoplayer2.upstream.cache.LeastRecentlyUsedCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;

public class SharedExoPlayerCache {

    private static SimpleCache simpleCache;
    private static final long exoPlayerCacheSize = 200 * 1024 * 1024;

    public static void initCache(Context context) {
        LeastRecentlyUsedCacheEvictor leastRecentlyUsedCacheEvictor = new LeastRecentlyUsedCacheEvictor(exoPlayerCacheSize);
        StandaloneDatabaseProvider exoDatabaseProvider = new StandaloneDatabaseProvider(context);
        simpleCache = new SimpleCache(context.getCacheDir(), leastRecentlyUsedCacheEvictor, exoDatabaseProvider);
    }

    public static SimpleCache getCache() {
        return simpleCache;
    }

}