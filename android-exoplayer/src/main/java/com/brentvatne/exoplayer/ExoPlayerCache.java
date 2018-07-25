package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import com.google.android.exoplayer2.upstream.cache.NoOpCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.Cache;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;
import com.google.android.exoplayer2.upstream.cache.CacheUtil;
import com.google.android.exoplayer2.upstream.cache.CacheDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSourceInputStream;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.IOException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

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
    public void exportVideo(final String url, final Promise promise) {
        Log.d(getName(), "exportVideo");

        Thread exportThread = new Thread(new Runnable() {
            @Override
            public void run() {
                Log.d(getName(), "Exporting...");
                Log.d(getName(), url);
                final Uri uri = Uri.parse(url);
                final DataSpec dataSpec = new DataSpec(uri, 0, 100 * 1024 * 1024, null); // TODO won't work for video's over 100 MB
                final SimpleCache downloadCache = ExoPlayerCache.getInstance(getReactApplicationContext());
                CacheUtil.CachingCounters counters = new CacheUtil.CachingCounters();
                
                try {
                    CacheUtil.getCached(
                        dataSpec, 
                        downloadCache,
                        counters
                    );

                    // TODO check counters for when download is not complete // Download can complete during writing
                    Log.d(getName(), "Cached " + counters.totalCachedBytes() + " bytes (start)");

                    DataSourceInputStream inputStream = new DataSourceInputStream(createDataSource(downloadCache), dataSpec);

                    File targetFile = new File(ExoPlayerCache.getCacheDir(getReactApplicationContext()) + "/" + uri.getLastPathSegment());
                    OutputStream outStream = new FileOutputStream(targetFile);
                    
                    byte[] buffer = new byte[8 * 1024];
                    int bytesRead;
                    try {
                        while ((bytesRead = inputStream.read(buffer)) != -1) {
                            outStream.write(buffer, 0, bytesRead);
                        }
                    } catch (IOException e) {
                        // TODO this exception should not be thrown
                        Log.d(getName(), "Read error");
                        e.printStackTrace();
                    }

                    CacheUtil.getCached(
                        dataSpec, 
                        downloadCache,
                        counters
                    );

                    // TODO are we sure the complete video is downloaded?
                    Log.d(getName(), "Cached " + counters.totalCachedBytes() + " bytes (end)");

                    Log.d(getName(), "Export succeeded");
                    Log.d(getName(), targetFile.getPath());

                    promise.resolve(targetFile.getPath());
                } catch (Exception e) {
                    Log.d(getName(), "Export error");
                    e.printStackTrace();
                    promise.reject(e);
                }
            }
        }, "export_thread");
        exportThread.start();
    }

    public static SimpleCache getInstance(Context context) {
        if(instance == null) {
            instance = new SimpleCache(new File(ExoPlayerCache.getCacheDir(context)), new NoOpCacheEvictor());
        }
        return instance;
    }

    private static String getCacheDir(Context context) {
        return context.getCacheDir().toString() + "/video";
    }

    private DataSource createDataSource(Cache cache) {
        return new CacheDataSourceFactory(cache, DataSourceUtil.getDefaultDataSourceFactory(
            getReactApplicationContext(),
            null,
            null
        )).createDataSource();
    }

}
