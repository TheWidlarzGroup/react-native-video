package com.brentvatne.entity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Map;

public class RNImaSource {

    private static final String KEY_ASSET_KEY = "assetKey";
    private static final String KEY_CONTENT_SOURCE_ID = "contentSourceId";
    private static final String KEY_VIDEO_ID = "videoId";
    private static final String KEY_AUTH_TOKEN = "authToken";
    private static final String KEY_AD_TAG_PARAMETERS = "adTagParameters";

    private final String assetKey;
    private final String contentSourceId;
    private final String videoId;
    private final String authToken;
    private final Map<String, Object> adTagParameters;

    public RNImaSource(@NonNull Map<String, Object> imaSource) {
        this.assetKey = (String) imaSource.get(KEY_ASSET_KEY);
        this.contentSourceId = (String) imaSource.get(KEY_CONTENT_SOURCE_ID);
        this.videoId = (String) imaSource.get(KEY_VIDEO_ID);
        this.authToken = (String) imaSource.get(KEY_AUTH_TOKEN);
        this.adTagParameters = (Map<String, Object>) imaSource.get(KEY_AD_TAG_PARAMETERS);
    }

    @Nullable
    public String getAssetKey() {
        return assetKey;
    }

    @Nullable
    public String getContentSourceId() {
        return contentSourceId;
    }

    @Nullable
    public String getVideoId() {
        return videoId;
    }

    @Nullable
    public String getAuthToken() {
        return authToken;
    }

    @Nullable
    public Map<String, Object> getAdTagParameters() {
        return adTagParameters;
    }
}
