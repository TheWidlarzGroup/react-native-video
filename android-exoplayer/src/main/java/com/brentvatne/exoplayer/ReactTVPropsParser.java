package com.brentvatne.exoplayer;

import android.net.Uri;
import android.text.TextUtils;
import android.util.Pair;

import androidx.annotation.NonNull;

import com.brentvatne.util.ReadableMapUtils;
import com.diceplatform.doris.entity.ImaCsaiProperties;
import com.diceplatform.doris.entity.YoSsaiProperties;
import com.diceplatform.doris.entity.YoSsaiProperties.YoVideoType;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import javax.annotation.Nullable;

public class ReactTVPropsParser {

    private ReactTVPropsParser() {
        // prevent instantiation.
    }

    /**
     * "adUnits": [
     *     {
     *       "insertionType": "CSAI",
     *       "adFormat": "PREROLL",
     *       "adTagUrl": "https://whatever.doubleclick.net/something/ads?iu=..."
     *     },
     *     {
     *       "insertionType": "CSAI",
     *       "adFormat": "MIDROLL",
     *       "adTagUrl": "https://whatever.doubleclick.net/something/ads?iu=..."
     *     },
     *     // AdManifestUnit SIS response type (the new one when SIS applies):
     *     // the value below is the base64, url encoded of uuid=5d91513d-e599-49af-9bf2-65aeb3db1c38&region=eu-west-1
     *     {
     *       "insertionType": "SSAI",
     *       "adFormat": "VOD_VMAP/MIDROLL",
     *       "adProvider": "YOSPACE",
     *       "adManifestParams" : [{
     *             "key":sis_params",
     *             "value":"dXVpZD01ZDkxNTEzZC1lNTk5LTQ5YWYtOWJmMi02NWFlYjNkYjFjMzgmcmVnaW9uPWV1LXdlc3QtMQ%3D%3D"
     *       },{...}]
     *     },
     *     // AdManifestUnit non SIS response type
     *     // the value below is the base64, url encoded of "iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator="
     *     {
     *       "insertionType": "SSAI",
     *       "adFormat": "PREROLL",
     *       "adProvider": "YOSPACE",
     *       "adManifestParams" : [{
     *             "key":ssp_params",
     *             "value":"aXU9LzIxNzc1NzQ0OTIzL2V4dGVybmFsL3NpbmdsZV9hZF9zYW1wbGVzJnN6PTY0MHg0ODAmY3VzdF9wYXJhbXM9c2FtcGxlX2N0JTNEbGluZWFyJmNpdV9zenM9MzAweDI1MCUyQzcyOHg5MCZnZGZwX3JlcT0xJm91dHB1dD12YXN0JnVudmlld2VkX3Bvc2l0aW9uX3N0YXJ0PTEmZW52PXZwJmltcGw9cyZjb3JyZWxhdG9yPQ%3D%3D"
     *       },{...}]
     *     }
     *   ]
     */
    @NonNull
    public static Pair<ImaCsaiProperties, YoSsaiProperties> parseAdUnitsV2(
            boolean isLive,
            @Nullable ReadableMap src) {
        String adTagUrl = ReadableMapUtils.getString(src, "adTagUrl");
        ImaCsaiProperties imaCsai = ImaCsaiProperties.from(adTagUrl);
        ReadableMap adsMap = ReadableMapUtils.getMap(src, "ads");
        if (adsMap == null) {
            return Pair.create(imaCsai.normalize(), null);
        }

        YoVideoType videoType = isLive ? YoVideoType.LIVE : YoVideoType.VOD;
        YoSsaiProperties.Builder yoSsaiBuilder = new YoSsaiProperties.Builder();
        ReadableArray adUnits = ReadableMapUtils.getArray(adsMap, "adUnits");
        int adUnitCount = adUnits == null ? 0 : adUnits.size();
        for (int i = 0; i < adUnitCount; i++) {
            ReadableMap adUnit = adUnits.getMap(i);
            String insertionType = ReadableMapUtils.getString(adUnit, "insertionType");
            if ("CSAI".equalsIgnoreCase(insertionType)) {
                imaCsai = parseImaCsaiProperties(imaCsai, adUnit);
            } else if ("SSAI".equalsIgnoreCase(insertionType)) {
                String adProvider = ReadableMapUtils.getString(adUnit, "adProvider");
                if ("YOSPACE".equalsIgnoreCase(adProvider)) {
                    yoSsaiBuilder.setYoVideoType(videoType);
                    parseYoSsaiProperties(yoSsaiBuilder, adUnit);
                }
            }
        }
        YoSsaiProperties yoSsai = yoSsaiBuilder.build();
        if (yoSsai != null) {
            // Currently we do not support csai ads on yospace ssai player.
            imaCsai = ImaCsaiProperties.from(null);
        }
        return Pair.create(imaCsai.normalize(), yoSsai);
    }

    private static ImaCsaiProperties parseImaCsaiProperties(ImaCsaiProperties imaCsai, ReadableMap adUnit) {
        String adFormat = ReadableMapUtils.getString(adUnit, "adFormat");
        if ("PREROLL".equalsIgnoreCase(adFormat) || "VOD_VMAP".equalsIgnoreCase(adFormat)) {
            Uri preRollAdTagUri = parseAdTagUrl(adUnit);
            if (preRollAdTagUri != null) {
                imaCsai = ImaCsaiProperties.from(preRollAdTagUri, imaCsai.midRollAdTagUri, imaCsai.midRollSlateUri);
            }
        } else if ("MIDROLL".equalsIgnoreCase(adFormat)) {
            Uri midRollAdTagUri = parseAdTagUrl(adUnit);
            if (midRollAdTagUri != null) {
                imaCsai = ImaCsaiProperties.from(imaCsai.preRollAdTagUri, midRollAdTagUri, imaCsai.midRollSlateUri);
            }
        }
        return imaCsai;
    }

    private static Uri parseAdTagUrl(ReadableMap map) {
        String adTagUrl = ReadableMapUtils.getString(map, "adTagUrl");
        return TextUtils.isEmpty(adTagUrl) ? null : Uri.parse(adTagUrl);
    }

    private static void parseYoSsaiProperties(YoSsaiProperties.Builder yoSsaiBuilder, ReadableMap adUnit) {
        ReadableArray adParams = ReadableMapUtils.getArray(adUnit, "adManifestParams");
        int adParamCount = adParams == null ? 0 : adParams.size();
        if (adParamCount == 0) {
            return;
        }
        for (int i = 0; i < adParamCount; i++) {
            ReadableMap adParam = adParams.getMap(i);
            String key = ReadableMapUtils.getString(adParam, "key");
            String value = ReadableMapUtils.getString(adParam, "value");
            yoSsaiBuilder.addAdManifestParam(key, value);
        }
    }
}
