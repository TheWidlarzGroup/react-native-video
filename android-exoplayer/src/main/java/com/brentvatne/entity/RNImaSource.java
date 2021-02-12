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
    private static final String KEY_START_DATE = "startDate";
    private static final String KEY_END_DATE = "endDate";

    private final String assetKey;
    private final String contentSourceId;
    private final String videoId;
    private final String authToken;

    private Map<String, Object> adTagParametersMap;
    private double startDate;
    private double endDate;

    public RNImaSource(@NonNull Map<String, Object> imaSource) {
        this.assetKey = (String) imaSource.get(KEY_ASSET_KEY);
        this.contentSourceId = (String) imaSource.get(KEY_CONTENT_SOURCE_ID);
        this.videoId = (String) imaSource.get(KEY_VIDEO_ID);
        this.authToken = (String) imaSource.get(KEY_AUTH_TOKEN);
        this.adTagParametersMap = (Map<String, Object>) imaSource.get(KEY_AD_TAG_PARAMETERS);
        this.startDate = imaSource.get(KEY_START_DATE) != null ?
                         (double) imaSource.get(KEY_START_DATE) :
                         Long.MIN_VALUE;
        this.endDate = imaSource.get(KEY_END_DATE) != null ?
                       (double) imaSource.get(KEY_END_DATE) :
                       Long.MAX_VALUE;
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
    public Map<String, Object> getAdTagParametersMap() {
        return adTagParametersMap;
    }

    public double getStartDate() {
        return startDate;
    }

    public double getEndDate() {
        return endDate;
    }

    public void replaceAdTagParameters(
            Map<String, Object> adTagParameters,
            double startDate,
            double endDate) {
        this.adTagParametersMap = adTagParameters;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
