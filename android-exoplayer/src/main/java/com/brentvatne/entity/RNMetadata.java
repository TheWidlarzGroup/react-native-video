package com.brentvatne.entity;

import androidx.annotation.Nullable;

public class RNMetadata {

    private final String description;
    private final String thumbnailUrl;
    private final String type;
    private final String episodeTitle;

    public RNMetadata(
            @Nullable String description,
            @Nullable String thumbnailUrl,
            @Nullable String episodeTitle,
            @Nullable String type) {
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.episodeTitle = episodeTitle;
        this.type = type;
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    @Nullable
    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    @Nullable
    public String getEpisodeTitle() {
        return episodeTitle;
    }

    @Nullable
    public String getType() {
        return type;
    }
}
