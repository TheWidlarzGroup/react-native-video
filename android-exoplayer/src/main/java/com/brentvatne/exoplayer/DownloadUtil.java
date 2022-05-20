package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.google.android.exoplayer2.database.DatabaseProvider;
import com.google.android.exoplayer2.database.ExoDatabaseProvider;
import com.google.android.exoplayer2.ext.cronet.CronetDataSource;
import com.google.android.exoplayer2.ext.cronet.CronetEngineWrapper;
import com.google.android.exoplayer2.offline.ActionFileUpgradeUtil;
import com.google.android.exoplayer2.offline.DefaultDownloadIndex;
import com.google.android.exoplayer2.offline.Download;
import com.google.android.exoplayer2.offline.DownloadManager;
import com.google.android.exoplayer2.ui.DownloadNotificationHelper;
import com.google.android.exoplayer2.upstream.*;
import com.google.android.exoplayer2.upstream.cache.Cache;
import com.google.android.exoplayer2.upstream.cache.CacheDataSource;
import com.google.android.exoplayer2.upstream.cache.NoOpCacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;
import com.google.android.exoplayer2.util.Util;
import org.checkerframework.checker.nullness.qual.MonotonicNonNull;

import java.io.File;
import java.io.IOException;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.util.concurrent.Executors;

public class DownloadUtil {

    public static final String DOWNLOAD_NOTIFICATION_CHANNEL_ID = "download_channel";

    private static final boolean USE_CRONET_FOR_NETWORKING = true;


    public static final String TAG = "DownloaderModule";
    private static final String DOWNLOAD_ACTION_FILE = "actions";
    private static final String DOWNLOAD_TRACKER_ACTION_FILE = "tracked_actions";
    private static final String DOWNLOAD_CONTENT_DIRECTORY = "downloads";

    private static final int MAX_SIMULTANEOUS_DOWNLOADS = 1;


    private static DataSource.@MonotonicNonNull Factory dataSourceFactory;
    private static HttpDataSource.@MonotonicNonNull Factory httpDataSourceFactory;
    private static @MonotonicNonNull DatabaseProvider databaseProvider;
    private static @MonotonicNonNull File downloadDirectory;
    private static @MonotonicNonNull Cache downloadCache;
    private static @MonotonicNonNull DownloadManager downloadManager;
    private static @MonotonicNonNull DownloadTracker downloadTracker;
    private static @MonotonicNonNull DownloadNotificationHelper downloadNotificationHelper;


    private static Uri resolveUri(Uri uri, String queryParams) {
        String resultPath = queryParams == null ? uri.toString() : String.format("%s%s", uri.toString(), queryParams);
        return Uri.parse(resultPath);
    }

    public static ResolvingDataSource.Factory getResolvingFactory(DataSource.Factory factory, String queryParams) {
        return new ResolvingDataSource.Factory(factory,
                (DataSpec dataSpec) -> {

            DataSpec ds = dataSpec;

            if(dataSpec.uri.getQuery() == null) {
                ds = dataSpec.withUri(resolveUri(dataSpec.uri, queryParams));
            }

            Log.i(TAG, ds.uri.toString());
            return ds;
        });
    }

    public static synchronized HttpDataSource.Factory getHttpDataSourceFactory(Context context) {
        if (httpDataSourceFactory == null) {
            String USER_AGENT = Util.getUserAgent(context, "MediaDownloader");
            if (USE_CRONET_FOR_NETWORKING) {
                context = context.getApplicationContext();
                CronetEngineWrapper cronetEngineWrapper =
                        new CronetEngineWrapper(context, USER_AGENT, /* preferGMSCoreCronet= */ false);
                httpDataSourceFactory =
                        new CronetDataSource.Factory(cronetEngineWrapper, Executors.newSingleThreadExecutor());
            } else {
                CookieManager cookieManager = new CookieManager();
                cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
                CookieHandler.setDefault(cookieManager);
                httpDataSourceFactory = new DefaultHttpDataSource.Factory().setUserAgent(USER_AGENT);
            }
        }
        return httpDataSourceFactory;
    }


    /** Returns a {@link DataSource.Factory}. */
    public static synchronized DataSource.Factory getDataSourceFactory(Context context) {
        if (dataSourceFactory == null) {
            DefaultDataSourceFactory upstreamFactory =
                    new DefaultDataSourceFactory(context, getHttpDataSourceFactory(context));
            dataSourceFactory = buildReadOnlyCacheDataSource(upstreamFactory, getDownloadCache(context));
        }
        return dataSourceFactory;
    }

    public static synchronized DownloadNotificationHelper getDownloadNotificationHelper(
            Context context) {
        if (downloadNotificationHelper == null) {
            downloadNotificationHelper =
                    new DownloadNotificationHelper(context, DOWNLOAD_NOTIFICATION_CHANNEL_ID);
        }
        return downloadNotificationHelper;
    }

    public static synchronized DownloadManager getDownloadManager(Context context) {
        ensureDownloadManagerInitialized(context);
        return downloadManager;
    }

    public static synchronized DownloadTracker getDownloadTracker(Context context) {
        ensureDownloadManagerInitialized(context);
        return downloadTracker;
    }

    private static synchronized Cache getDownloadCache(Context context) {
        if (downloadCache == null) {
            File downloadContentDirectory =
                    new File(getDownloadDirectory(context), DOWNLOAD_CONTENT_DIRECTORY);
            downloadCache =
                    new SimpleCache(
                            downloadContentDirectory, new NoOpCacheEvictor(), getDatabaseProvider(context));
        }
        return downloadCache;
    }


    private static synchronized void ensureDownloadManagerInitialized(Context context) {
        if (downloadManager == null) {
            DefaultDownloadIndex downloadIndex = new DefaultDownloadIndex(getDatabaseProvider(context));
            upgradeActionFile(
                    context, DOWNLOAD_ACTION_FILE, downloadIndex, /* addNewDownloadsAsCompleted= */ false);
            upgradeActionFile(
                    context,
                    DOWNLOAD_TRACKER_ACTION_FILE,
                    downloadIndex,
                    /* addNewDownloadsAsCompleted= */ true);

            HttpDataSource.Factory ds = getHttpDataSourceFactory(context);


            DataSource.Factory dataSource = () -> {

                Log.i(TAG, "Creating new datasource");

                HttpDataSource.Factory newDataSource = ds;
                if (downloadTracker != null) {
                    Download download = downloadTracker.getCurrentDownload();
                    if (download != null) {
                        String downloadID = download.request.id;

                        if (downloadID != null) {
                            Log.i(TAG, download.request.id);
                            DownloadCred downloadCred = downloadTracker.getDownloadCred(downloadID);
                            String queryParams = downloadCred.queryParams;

                            if (queryParams != null) {
                                return getResolvingFactory(newDataSource, queryParams).createDataSource();
                            }
                        }
                    }
                }
                return newDataSource.createDataSource();
            };


            downloadManager = new DownloadManager(context, getDatabaseProvider(context),getDownloadCache(context), dataSource, Executors.newFixedThreadPool(6));
            downloadManager.setMaxParallelDownloads(MAX_SIMULTANEOUS_DOWNLOADS);
            downloadManager.setMinRetryCount(5);
            downloadTracker =
                    new DownloadTracker(
                            (ReactApplicationContext) context,
                            ds,
                            downloadManager);

            downloadTracker.addListener(() -> {
                Log.d(TAG,"onDownloadsChanged");
            });

            downloadManager.resumeDownloads();
        }
    }

    private static synchronized void upgradeActionFile(
            Context context,
            String fileName,
            DefaultDownloadIndex downloadIndex,
            boolean addNewDownloadsAsCompleted) {
        try {
            ActionFileUpgradeUtil.upgradeAndDelete(
                    new File(getDownloadDirectory(context), fileName),
                    /* downloadIdProvider= */ null,
                    downloadIndex,
                    /* deleteOnFailure= */ true,
                    addNewDownloadsAsCompleted);
        } catch (IOException e) {
            Log.e(TAG, "Failed to upgrade action file: " + fileName, e);
        }
    }

    private static synchronized DatabaseProvider getDatabaseProvider(Context context) {
        if (databaseProvider == null) {
            databaseProvider = new ExoDatabaseProvider(context);
        }
        return databaseProvider;
    }


    private static File getDownloadDirectory(Context context) {
        if (downloadDirectory == null) {
            downloadDirectory = context.getExternalFilesDir(null);
            if (downloadDirectory == null) {
                downloadDirectory = context.getFilesDir();
            }
        }
        return downloadDirectory;
    }

    private static CacheDataSource.Factory buildReadOnlyCacheDataSource(
            DataSource.Factory upstreamFactory, Cache cache) {
        return new CacheDataSource.Factory()
                .setCache(cache)
                .setUpstreamDataSourceFactory(upstreamFactory)
                .setCacheWriteDataSinkFactory(null)
                .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR);
    }
}
