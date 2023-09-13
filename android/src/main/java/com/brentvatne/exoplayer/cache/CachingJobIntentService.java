package com.brentvatne.exoplayer.cache;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.JobIntentService;

import com.brentvatne.exoplayer.DataSourceUtil;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.cache.CacheWriter;

import java.io.IOException;

public class CachingJobIntentService extends JobIntentService {

    private static final int JOB_ID = 1070200;
    private static final String JOB_NAME = "CachingJobIntentService.Prefetch";
    private static final String URL = "CachingJobIntentService.URL";
    private static final String TAG = "CachingJobIntentService";

    public static void enqueuePrefetchWork(Context context, String url) {
        Intent intent = new Intent(JOB_NAME);
        intent.putExtra(URL, url);
        enqueueWork(context, CachingJobIntentService.class, JOB_ID, intent);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {
        String urlToPrefetch = intent.getStringExtra(URL);
        Uri uri = Uri.parse(urlToPrefetch);

        CacheWriter cacheWriter = new CacheWriter(DataSourceUtil.cacheDataSourceAtomicReference.get(), new DataSpec(uri), null, null);
        try {
            cacheWriter.cache();
        } catch (IOException e) {
            Log.e(TAG, "onHandleWork: ", e);
            // TODO log to Firebase?
        }
    }
}
