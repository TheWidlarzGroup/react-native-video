package com.brentvatne.entity;

public class RNApsSource {

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
