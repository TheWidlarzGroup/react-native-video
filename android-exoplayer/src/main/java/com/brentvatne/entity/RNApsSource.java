package com.brentvatne.entity;

import java.util.Map;

public class RNApsSource {

    private static final String KEY_ASSET_KEY = "assetKey";
    private static final String KEY_CONTENT_SOURCE_ID = "contentSourceId";
    private static final String KEY_VIDEO_ID = "videoId";
    private static final String KEY_AUTH_TOKEN = "authToken";
    private static final String KEY_AD_TAG_PARAMETERS = "adTagParameters";

    private final String id;
    private final String rating;
    private final String[] genre;
    private final String channel;
    private final String length;

    public RNApsSource(
            String id,
            String rating,
            String[] genre,
            String channel,
            String length) {
        this.id = id;
        this.rating = rating;
        this.genre = genre;
        this.channel = channel;
        this.length = length;
    }

    public String getId() {
        return id;
    }

    public String getRating() {
        return rating;
    }

    public String[] getGenre() {
        return genre;
    }

    public String getChannel() {
        return channel;
    }

    public String getLength() {
        return length;
    }
}
