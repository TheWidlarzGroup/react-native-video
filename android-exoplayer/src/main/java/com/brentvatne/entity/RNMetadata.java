package com.brentvatne.entity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class RNMetadata {

    private final String channelLogoUrl;
    private final String description;
    private final String thumbnailUrl;
    private final String title;
    private final String type;

    public RNMetadata(
            @Nullable String channelLogoUrl,
            @Nullable String description,
            @NonNull String thumbnailUrl,
            @NonNull String title,
            @NonNull String type) {
        this.channelLogoUrl = channelLogoUrl;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.title = title;
        this.type = type;
    }

    @Nullable
    public String getChannelLogoUrl() {
        return channelLogoUrl;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    @NonNull
    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    @NonNull
    public String getTitle() {
        return title;
    }

    @NonNull
    public String getType() {
        return type;
    }
}
