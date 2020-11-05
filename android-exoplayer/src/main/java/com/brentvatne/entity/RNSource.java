package com.brentvatne.entity;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.Map;

public class RNSource {

    private static final String KEY_ASSET_KEY = "assetKey";
    private static final String KEY_CONTENT_SOURCE_ID = "contentSourceId";
    private static final String KEY_VIDEO_ID = "videoId";
    private static final String KEY_AUTH_TOKEN = "authToken";
    private static final String KEY_AD_TAG_PARAMETERS = "adTagParameters";

//    private VideoMetadata metadata;

    private final Uri uri;
    private final String id;
    private final String title;
    private final String description;
    private final String type;
    private final boolean isLive;
    private final ArrayList<SubtitleTrack> textTracks;
    private final Map<String, String> headers;
    private final Map<String, Object> muxData;
    private final String thumbnailUrl;
    private final String selectedAudioTrack;
    private final String locale;

//    public final VideoInformation videoInfo;
//    public final BeaconConfig beaconConfig;

    public RNSource(
            @NonNull Uri uri,
            @NonNull String id,
            @Nullable String title,
            @Nullable String description,
            @Nullable String type,
            boolean isLive,
            @Nullable ArrayList<SubtitleTrack> textTracks,
            @Nullable Map<String, String> headers,
            @Nullable Map<String, Object> muxData,
            @Nullable String thumbnailUrl,
            @Nullable String selectedAudioTrack,
            @Nullable String locale) {
        this.uri = uri;
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.isLive = isLive;
        this.textTracks = textTracks;
        this.headers = headers;
        this.muxData = muxData;
        this.thumbnailUrl = thumbnailUrl;
        this.selectedAudioTrack = selectedAudioTrack;
        this.locale = locale;
    }

    public Uri getUri() {
        return uri;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getType() {
        return type;
    }

    public boolean isLive() {
        return isLive;
    }

    public ArrayList<SubtitleTrack> getTextTracks() {
        return textTracks;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public Map<String, Object> getMuxData() {
        return muxData;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getSelectedAudioTrack() {
        return selectedAudioTrack;
    }

    public String getLocale() {
        return locale;
    }
}
