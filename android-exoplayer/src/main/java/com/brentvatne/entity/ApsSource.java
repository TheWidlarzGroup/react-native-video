package com.brentvatne.entity;

import androidx.annotation.Nullable;

public class ApsSource {

    private final String id;
    private final String rating;
    private final String[] genres;
    private final String channel;
    private final String length;

    public ApsSource(
            @Nullable String id,
            @Nullable String rating,
            @Nullable String[] genres,
            @Nullable String channel,
            @Nullable String length) {
        this.id = id;
        this.rating = rating;
        this.genres = genres;
        this.channel = channel;
        this.length = length;
    }

    @Nullable
    public String getId() {
        return id;
    }

    @Nullable
    public String getRating() {
        return rating;
    }

    @Nullable
    public String[] getGenres() {
        return genres;
    }

    @Nullable
    public String getChannel() {
        return channel;
    }

    @Nullable
    public String getLength() {
        return length;
    }
}
