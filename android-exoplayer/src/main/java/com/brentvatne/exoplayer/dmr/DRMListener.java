package com.brentvatne.exoplayer.dmr;

import android.util.Log;

import com.google.android.exoplayer2.drm.DefaultDrmSessionManager;

public class DRMListener implements DefaultDrmSessionManager.EventListener {

    public DRMListener() { }

    @Override
    public void onDrmKeysLoaded() {
        Log.d("DMR", "Loaded Keys");
    }

    @Override
    public void onDrmSessionManagerError(Exception e) {
        Log.d("DMR:error", e.toString());
    }

    @Override
    public void onDrmKeysRestored() {
        Log.d("DMR", "Keys restored");
    }

    @Override
    public void onDrmKeysRemoved() {
        Log.d("DMR", "Keys removed");
    }
}
