package com.brentvatne.entity;

import android.net.Uri;

public class SubtitleTrack {

    private static final String KEY_URI = "uri";
    private static final String KEY_LANGUAGE = "language";
    private static final String KEY_TYPE = "type";

    private Uri url;
    private String language;
    private String type;

    public SubtitleTrack(Uri url, String language, String type) {
        this.url = url;
        this.language = language;
        this.type = type;
    }

    public Uri getUrl() {
        return url;
    }

    public String getLanguage() {
        return language;
    }

    public String getType() {
        return type;
    }
}
