package com.brentvatne.exoplayer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactContext;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.FileDataSource;
import com.google.android.exoplayer2.upstream.cache.CacheDataSink;
import com.google.android.exoplayer2.upstream.cache.CacheDataSource;
import com.google.android.exoplayer2.upstream.cache.LeastRecentlyUsedCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;

import java.io.File;
import java.util.Map;

public class CacheDataSourceFactory implements DataSource.Factory {
    private final ReactContext reactContext;
    private final DataSource.Factory defaultDatasourceFactory;
    private final long maxFileSize, maxCacheSize;

    private static SimpleCache simpleCacheInstance;

    public CacheDataSourceFactory(ReactContext reactContext, int maxCacheSize, int maxFileSize,
                                  DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        super();
        this.reactContext = reactContext;
        this.maxCacheSize = (long) maxCacheSize * 1024 * 1024;
        this.maxFileSize = (long) maxFileSize * 1024 * 1024;
        this.defaultDatasourceFactory =
                DataSourceUtil.getDefaultDataSourceFactory(reactContext, bandwidthMeter, requestHeaders);
    }

    @NonNull
    @Override
    public DataSource createDataSource() {
        SimpleCache simpleCache = CacheDataSourceFactory.getSimpleCacheInstance(reactContext, maxCacheSize);

        CacheDataSink cacheDataSink = new CacheDataSink(simpleCache, maxFileSize);

        return new CacheDataSource(simpleCache, defaultDatasourceFactory.createDataSource(),
                new FileDataSource(), cacheDataSink,
                CacheDataSource.FLAG_BLOCK_ON_CACHE | CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR, null);
    }

    public static SimpleCache getSimpleCacheInstance(ReactContext reactContext, long maxCacheSize) {
        if (simpleCacheInstance == null) {
            simpleCacheInstance = new SimpleCache(new File(reactContext.getCacheDir(), "video"),
                    new LeastRecentlyUsedCacheEvictor(maxCacheSize));
        }
        return simpleCacheInstance;
    }
}