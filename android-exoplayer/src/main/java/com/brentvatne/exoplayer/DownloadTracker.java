package com.brentvatne.exoplayer;

import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import android.util.Log;

import static com.google.android.exoplayer2.util.Assertions.checkNotNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.exoplayer2.DefaultRenderersFactory;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.offline.*;
import com.google.android.exoplayer2.upstream.HttpDataSource;

import java.io.IOException;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.CopyOnWriteArraySet;

public class DownloadTracker {

    public interface Listener {
        void onDownloadsChanged();
    }

    private static final String TAG = "DownloadTracker";

    private final ReactApplicationContext context;
    private final HttpDataSource.Factory httpDataSourceFactory;
    private final CopyOnWriteArraySet<Listener> listeners;
    private final HashMap<String, Download> downloads;
    private final HashMap<String, DownloadCred> downloadCreds;
    private final DownloadIndex downloadIndex;
    @Nullable private StartDownloadHelper startDownloadHelper;

    public DownloadTracker(ReactApplicationContext context, HttpDataSource.Factory httpDataSourceFactory, DownloadManager downloadManager) {
        this.context = context;
        this.httpDataSourceFactory = httpDataSourceFactory;
        listeners = new CopyOnWriteArraySet<>();
        downloads = new HashMap<>();
        downloadCreds = new HashMap<>();
        downloadIndex = downloadManager.getDownloadIndex();
        downloadManager.addListener(new DownloadManagerListener());
        loadDownloads();
        downloadProgressUpdate();
    }

    public void addListener(Listener listener) {
        checkNotNull(listener);
        listeners.add(listener);
    }

    public void setDownloadCred(String downloadID, String queryParam, String cookie) {
        downloadCreds.put(downloadID, new DownloadCred(queryParam, cookie));
    }

    public DownloadCred getDownloadCred(String downloadID) {
        return downloadCreds.get(downloadID);
    }

    public void onDownloadProgressEvent(String downloadID, float progress){
        WritableMap params = Arguments.createMap();
        params.putString("downloadID", downloadID);
        params.putDouble("percentComplete", progress);
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("onDownloadProgress", params);
    }

    public void onDownloadFinishedEvent(String downloadID, long downloadedBytes){
        WritableMap params = Arguments.createMap();
        params.putString("downloadID", downloadID);
        params.putDouble("size", downloadedBytes);
        //TODO: Add local path of downloaded file
        params.putString("downloadLocation", "N/A");
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("onDownloadFinished", params);
    }

    public void onDownloadCancelledEvent(String downloadID){
        WritableMap params = Arguments.createMap();
        params.putString("downloadID", downloadID);
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("onDownloadCancelled", params);
    }

    public void onDownloadStartedEvent(String downloadID){
        WritableMap params = Arguments.createMap();
        params.putString("downloadID", downloadID);
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("onDownloadStarted", params);
    }

    public void onDownloadErrorEvent(String downloadID, String errorType, String error){
        WritableMap params = Arguments.createMap();
        params.putString("error", error);
        params.putString("errorType", errorType);
        params.putString("downloadID", downloadID);
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("onDownloadError", params);
    }

    public Download getCurrentDownload() {
        for (Download download : DownloadUtil.getDownloadManager(context).getCurrentDownloads()) {
            if(download.state == Download.STATE_DOWNLOADING) {
                return download;
            }
        }
        return null;
    }


    private void downloadProgressUpdate(){
        new Timer().scheduleAtFixedRate(new TimerTask(){
            @Override
            public void run(){
                if (context.hasActiveCatalystInstance()) {
                    for (Download download : DownloadUtil.getDownloadManager(context).getCurrentDownloads()) {
                        if(download != null && download.getPercentDownloaded() > 0) {
                            onDownloadProgressEvent(download.request.id, download.getPercentDownloaded());
                        }
                    }
                }
            }
        },0,1000);
    }

    public void removeListener(Listener listener) {
        listeners.remove(listener);
    }

    public boolean isDownloaded(String downloadId) {
        @Nullable Download download = downloads.get(downloadId);
        return download != null && download.state != Download.STATE_FAILED;
    }


    public Download getDownload(String downloadId) {
        try {
            return downloadIndex.getDownload(downloadId);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }


    private DownloadHelper getDownloadHelper(Uri uri, String queryParams) {
        return DownloadHelper.forMediaItem(context, MediaItem.fromUri(uri), new DefaultRenderersFactory(context), DownloadUtil.getResolvingFactory(httpDataSourceFactory, queryParams));
    }


    public void toggleDownload(String downloadId, Uri uri) {
        @Nullable Download download = downloads.get(uri);
        if(download != null && download.state != Download.STATE_FAILED){

        } else {
            if(startDownloadHelper != null) {
                startDownloadHelper.release();
            }
            String queryParams = downloadCreds.get(downloadId).queryParams;
            DownloadHelper downloadHelper = getDownloadHelper(uri, queryParams);
            startDownloadHelper = new StartDownloadHelper(downloadHelper, downloadId);
        }
    }

    public void pauseDownload(String downloadId) {
        DownloadService.sendSetStopReason(context, NativeDownloadService.class, downloadId, Download.STATE_STOPPED, false);
    }

    public void resumeDownload(String downloadId) {
        DownloadService.sendSetStopReason(context, NativeDownloadService.class, downloadId, Download.STOP_REASON_NONE,/* foreground= */ false);
    }

    public void deleteDownload(String downloadId) {
        DownloadService.sendRemoveDownload(context, NativeDownloadService.class, downloadId, false);
    }

    private void loadDownloads() {
        try (DownloadCursor loadedDownloads = downloadIndex.getDownloads()) {
            while (loadedDownloads.moveToNext()) {
                Download download = loadedDownloads.getDownload();
                downloads.put(download.request.id, download);
            }
        } catch (IOException e) {
            Log.w(TAG, "Failed to query downloads", e);
        }
    }

    private class DownloadManagerListener implements DownloadManager.Listener {

        @Override
        public void onDownloadChanged(
                @NonNull DownloadManager downloadManager,
                @NonNull Download download,
                @Nullable Exception finalException) {
            String downloadID = download.request.id;

            Log.i(TAG, "Download changed");


            if(context.hasActiveCatalystInstance()){
                if(download.state == Download.STATE_COMPLETED){
                    Log.i(TAG, "Download Complete");
                    Log.i(TAG, Float.toString(download.getPercentDownloaded()));
                    if(download.getPercentDownloaded() == 100) {
                        if(downloadID != null){
                            onDownloadProgressEvent(downloadID, 100);
                            onDownloadFinishedEvent(downloadID, download.getBytesDownloaded());
                        }
                    }
                } else if (download.state == Download.STATE_DOWNLOADING){
                    if(downloadID != null) {
                        onDownloadStartedEvent(downloadID);
                    }
                } else if (download.state == Download.STATE_FAILED) {
                    if (downloadID != null) {
                        Log.e(TAG, "failed", finalException);
                        onDownloadErrorEvent(downloadID, "UNEXPECTEDLY_CANCELLED", finalException.toString());
                    }

                }
            }

            downloads.put(downloadID, download);
            for (Listener listener : listeners) {
                listener.onDownloadsChanged();
            }
        }

        @Override
        public void onDownloadRemoved(
                @NonNull DownloadManager downloadManager, @NonNull Download download) {
            downloads.remove(download.request.id);
            for (Listener listener : listeners) {
                listener.onDownloadsChanged();
            }
        }

        @Override
        public void onInitialized(DownloadManager downloadManager) {
            Log.i(TAG, "All downloads restored");
        }
    }


    private final class StartDownloadHelper implements DownloadHelper.Callback {

        private final DownloadHelper downloadHelper;
        private final String contentId;



        public StartDownloadHelper(DownloadHelper downloadHelper,String contentId) {
            this.downloadHelper = downloadHelper;
            this.contentId = contentId;
            downloadHelper.prepare(this);
        }

        public void release() {
            downloadHelper.release();
        }


        @Override
        public void onPrepared(DownloadHelper helper) {

            startDownload();
            release();
        }


        private void startDownload() {
            startDownload(buildDownloadRequest());
        }

        private void startDownload(DownloadRequest downloadRequest) {
            DownloadService.sendAddDownload(context, NativeDownloadService.class, downloadRequest, /* foreground= */ false);
        }

        private DownloadRequest buildDownloadRequest() {
            return downloadHelper.getDownloadRequest(contentId, null);
        }

        @Override
        public void onPrepareError(DownloadHelper helper, IOException e) {
            Log.e(TAG,
                    e instanceof DownloadHelper.LiveContentUnsupportedException ? "Downloading live content unsupported"
                            : "Failed to start download",
                    e);
        }
    }
}