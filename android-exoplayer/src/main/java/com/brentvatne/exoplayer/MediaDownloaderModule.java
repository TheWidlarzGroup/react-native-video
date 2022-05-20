package com.brentvatne.exoplayer;

import android.net.Uri;

import com.facebook.react.bridge.*;
import com.google.android.exoplayer2.offline.*;

import com.google.android.exoplayer2.util.Log;
import com.brentvatne.exoplayer.DownloadTracker;
import com.brentvatne.exoplayer.DownloadUtil;

import static com.brentvatne.exoplayer.DownloadUtil.TAG;

public class MediaDownloaderModule extends ReactContextBaseJavaModule {

    private static MediaDownloaderModule instance;
    ReactApplicationContext ctx = null;
    private DownloadTracker downloadTracker;

    public MediaDownloaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        ctx = reactContext;
        downloadTracker = DownloadUtil.getDownloadTracker(reactContext);
    }

    public static MediaDownloaderModule newInstance(ReactApplicationContext reactContext){
        if(instance == null){
            instance = new MediaDownloaderModule(reactContext);
        }
        return instance;
    }

    @ReactMethod
    public void downloadStreamWithBitRate(String videoUri, String downloadID, int bitRate){
        //TODO: Implement bitrate
        downloadStream(videoUri,downloadID);
    }

    @ReactMethod
    public void downloadStream(String uri, String downloadID){
        final Uri videoUri = Uri.parse(uri);

        Boolean isDownloaded = downloadTracker.isDownloaded(downloadID);

        if(isDownloaded){
            Log.i(TAG, "is downloaded");
            downloadTracker.onDownloadErrorEvent(downloadID,"ALREADY_DOWNLOADED","The asset is already downloaded");
            downloadTracker.onDownloadProgressEvent(downloadID, 100);
            return;
        }

        Download download = downloadTracker.getDownload(downloadID);
        if(download == null){
            downloadTracker.toggleDownload(downloadID, videoUri);
        } else if (download.state == Download.STATE_DOWNLOADING) {
            Log.i(TAG, "already downloading");
            downloadTracker.onDownloadErrorEvent(downloadID, "ALREADY_DOWNLOADED", "The asset is already downloading");
        } else {
            Log.d(TAG, "Download not started");
        }
    }

    @ReactMethod
    public void pauseDownload(final String downloadID){
        Download download = downloadTracker.getDownload(downloadID);
        if(download == null){
            downloadTracker.onDownloadErrorEvent(downloadID,"NOT_FOUND","Download does not exist.");
            return;
        }

        if(download.state == Download.STATE_DOWNLOADING) {
            downloadTracker.pauseDownload(downloadID);
        }
    }

    @ReactMethod
    public void resumeDownload(final String downloadID){
        Download download = downloadTracker.getDownload(downloadID);
        if(download == null){
            downloadTracker.onDownloadErrorEvent(downloadID,"NOT_FOUND","Download does not exist.");
            return;
        }

        if(download.state == Download.STATE_QUEUED){
            downloadTracker.resumeDownload(downloadID);
        }
    }

    @ReactMethod
    public void cancelDownload(final String downloadID){
        deleteDownloadedStream(downloadID);
    }

    @ReactMethod
    public void deleteDownloadedStream(final String downloadID){
        Download download = downloadTracker.getDownload(downloadID);
        if(download == null){
            downloadTracker.onDownloadErrorEvent(downloadID,"NOT_FOUND","Download does not exist.");
            return;
        }
        downloadTracker.deleteDownload(downloadID);
        downloadTracker.onDownloadProgressEvent(downloadID,0);
    }

    @ReactMethod
    public void checkIfStillDownloaded(ReadableArray downloadIDs, final Promise promise) {
        WritableArray isDownloadedDownloadIDs = Arguments.createArray();
        for (int i=0; i<downloadIDs.size(); i++) {
            String stringId = downloadIDs.getString(i);
            if (stringId != null) {
                if (downloadTracker.isDownloaded(stringId)) {
                    isDownloadedDownloadIDs.pushString(stringId);
                }
            }
        }
        promise.resolve(isDownloadedDownloadIDs);
    }

    @ReactMethod
    public void updateDownloadCreds(String downloadID, String queryParam, String cookie) {
        downloadTracker.setDownloadCred(downloadID, queryParam, cookie);
    }

    @Override
    public String getName(){
        return "MediaDownloader";
    }
}
