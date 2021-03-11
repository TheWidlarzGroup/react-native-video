package com.brentvatne.entity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class Metadata {

    private final String id;
    private final String channelLogoUrl;
    private final String description;
    private final String thumbnailUrl;
    private final String title;
    private final String type;
    private final int duration;
    private final String channelName;

    public Metadata(
            @NonNull String id,
            @Nullable String channelLogoUrl,
            @Nullable String description,
            @NonNull String thumbnailUrl,
            @NonNull String title,
            @NonNull String type,
            int duration,
            @Nullable String channelName) {
        this.id = id;
        this.channelLogoUrl = channelLogoUrl;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.title = title;
        this.type = type;
        this.duration = duration;
        this.channelName = channelName;
    }

    @NonNull
    public String getId() {
        return id;
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

    public int getDuration() {
        return duration;
    }

    @Nullable
    public String getChannelName() {
        return channelName;
    }
}
