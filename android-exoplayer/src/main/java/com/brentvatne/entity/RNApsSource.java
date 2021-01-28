package com.brentvatne.entity;

import androidx.annotation.Nullable;

public class RNApsSource {

    private final String id;
    private final String rating;
    private final String[] genre;
    private final String channel;
    private final String length;

    public RNApsSource(
            @Nullable String id,
            @Nullable String rating,
            @Nullable String[] genre,
            @Nullable String channel,
            @Nullable String length) {
        this.id = id;
        this.rating = rating;
        this.genre = genre;
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
    public String[] getGenre() {
        return genre;
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
