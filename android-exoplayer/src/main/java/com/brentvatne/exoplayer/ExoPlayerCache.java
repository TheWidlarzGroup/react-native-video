package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import com.google.android.exoplayer2.upstream.cache.NoOpCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;
import com.google.android.exoplayer2.upstream.cache.CacheUtil;
import com.google.android.exoplayer2.upstream.cache.CacheDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSpec;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

public class ExoPlayerCache extends ReactContextBaseJavaModule {

    private static SimpleCache instance = null;
    

    public ExoPlayerCache(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "ExoPlayerCache";
    }

    @ReactMethod
    public void preloadVideo(final String url) {
        Log.d(getName(), "preloadVideo");

        Thread cacheThread = new Thread(new Runnable() {
            @Override
            public void run() {
                Log.d(getName(), "Caching...");
                Log.d(getName(), url);
                final Uri uri = Uri.parse(url);
                final DataSpec dataSpec = new DataSpec(uri, 0, 100 * 1024 * 1024, null);
                final SimpleCache downloadCache = ExoPlayerCache.getInstance(getReactApplicationContext());
                
                try {
                    CacheUtil.cache(
                        dataSpec, 
                        downloadCache,
                        new CacheDataSourceFactory(downloadCache, DataSourceUtil.getDefaultDataSourceFactory(
                            getReactApplicationContext(),
                            null,
                            null
                        )).createDataSource(),
                        null,
                        null
                    );

                    Log.d(getName(), "Cache succeeded");
                } catch (Exception e) {
                    Log.d(getName(), "Cache error");
                    e.printStackTrace();
                }
            }
        }, "cache_thread");
        cacheThread.start();
    }

    public static SimpleCache getInstance(Context context) {
        if(instance == null) {
            instance = new SimpleCache(new File(context.getCacheDir().toString() + "/video-cache"), new NoOpCacheEvictor());
        }
        return instance;
    }

}
