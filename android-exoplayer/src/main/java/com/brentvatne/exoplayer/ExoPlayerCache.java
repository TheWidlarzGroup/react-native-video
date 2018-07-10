package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;

import com.google.android.exoplayer2.upstream.cache.NoOpCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;
import com.google.android.exoplayer2.offline.DownloadAction;
import com.google.android.exoplayer2.offline.DownloadManager;
import com.google.android.exoplayer2.offline.DownloadService;
import com.google.android.exoplayer2.offline.Downloader;
import com.google.android.exoplayer2.offline.DownloaderConstructorHelper;
import com.google.android.exoplayer2.offline.ProgressiveDownloadAction;
import com.google.android.exoplayer2.offline.ProgressiveDownloader;

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
    public void preloadVideo(String url) {
        DownloadAction downloadAction = new ProgressiveDownloadAction(Uri.parse(url), false, null, null);
        DownloadService.startWithAction(getReactApplicationContext(), CacheDownloadService.class, downloadAction, true);
    }

    public static SimpleCache getInstance(Context context) {
        if(instance == null) {
            instance = new SimpleCache(new File(context.getCacheDir().toString() + "/video-cache"), new NoOpCacheEvictor());
        }
        return instance;
    }

}
