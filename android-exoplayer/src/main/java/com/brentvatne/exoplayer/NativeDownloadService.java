package com.brentvatne.exoplayer;


import android.app.Notification;


import androidx.annotation.NonNull;

import com.google.android.exoplayer2.offline.Download;
import com.google.android.exoplayer2.offline.DownloadManager;
import com.google.android.exoplayer2.offline.DownloadService;
import com.google.android.exoplayer2.scheduler.PlatformScheduler;
import com.google.android.exoplayer2.util.Util;

import com.brentvatne.react.R;

import java.util.List;

import static com.brentvatne.exoplayer.DownloadUtil.DOWNLOAD_NOTIFICATION_CHANNEL_ID;

/** A service for downloading media. */
public class NativeDownloadService extends DownloadService {

    private static final int FOREGROUND_NOTIFICATION_ID = 1;
    private static final int JOB_ID = 1;

    public NativeDownloadService() {
        super(FOREGROUND_NOTIFICATION_ID,
                DEFAULT_FOREGROUND_NOTIFICATION_UPDATE_INTERVAL, DOWNLOAD_NOTIFICATION_CHANNEL_ID, R.string.exo_download_notification_channel_name, 0);
    }

    @Override
    @NonNull
    protected DownloadManager getDownloadManager() {
        return DownloadUtil.getDownloadManager(/* context= */ this);
    }

    @Override
    protected PlatformScheduler getScheduler() {
        return Util.SDK_INT >= 21 ? new PlatformScheduler(this, JOB_ID) : null;
    }

    @Override
    @NonNull
    protected Notification getForegroundNotification(@NonNull List<Download> downloads) {
        return DownloadUtil.getDownloadNotificationHelper(/* context= */ this)
                .buildProgressNotification(
                        /* context= */ this,
                        R.drawable.exo_controls_play,
                        /* contentIntent= */ null,
                        /* message= */ null,
                        downloads);
    }
}
