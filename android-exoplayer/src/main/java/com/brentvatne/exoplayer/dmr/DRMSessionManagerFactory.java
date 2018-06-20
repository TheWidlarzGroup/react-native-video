package com.brentvatne.exoplayer.dmr;

import android.os.Handler;
import android.util.Base64;

import com.google.android.exoplayer2.drm.DefaultDrmSessionManager;
import com.google.android.exoplayer2.drm.DrmSessionManager;
import com.google.android.exoplayer2.drm.ExoMediaDrm;
import com.google.android.exoplayer2.drm.MediaDrmCallback;
import com.google.android.exoplayer2.drm.UnsupportedDrmException;
import com.google.android.exoplayer2.util.Util;

import java.util.UUID;


public class DRMSessionManagerFactory {
    public static DrmSessionManager createSessionManager(UUID uuid, final String licenseUrl, Handler mainHandler) throws UnsupportedDrmException

    {
        if (Util.SDK_INT < 18) {
            return null;
        }
        final WidevineRequests requestHandler = new WidevineRequests();

        MediaDrmCallback drmCallback = new MediaDrmCallback() {
            @Override
            public byte[] executeProvisionRequest(UUID uuid, ExoMediaDrm.ProvisionRequest request) throws Exception {
                String url = request.getDefaultUrl() + "&signedRequest=" + new String(request.getData());
                return requestHandler.executePostProvisioning(url, null, null, false);
            }

            @Override
            public byte[] executeKeyRequest(UUID uuid, ExoMediaDrm.KeyRequest request) throws Exception {
                String url = request.getDefaultUrl();
                String licenseFinalUrl = !url.isEmpty() ? url : licenseUrl;
                return requestHandler.executePostLicenseRequest(licenseFinalUrl, Base64.encode(request.getData(), Base64.DEFAULT), null, true);
            }
        };
        return DefaultDrmSessionManager.newWidevineInstance(drmCallback,null, mainHandler ,new DRMListener());
    }
}
