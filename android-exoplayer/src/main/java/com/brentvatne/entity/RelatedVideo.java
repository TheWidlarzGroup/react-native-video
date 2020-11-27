package com.brentvatne.entity;

import java.util.Map;

public class RelatedVideo {

    private final String id;
    private final String title;
    private final String subtitle;
    private final String thumbnailUrl;
    private final Map<String, Object> relatedVideoMap;

    public RelatedVideo(
            String id,
            String title,
            String subtitle,
            String thumbnailUrl,
            Map<String, Object> relatedVideoMap) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.thumbnailUrl = thumbnailUrl;
        this.relatedVideoMap = relatedVideoMap;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public Map<String, Object> getRelatedVideoMap() {
        return relatedVideoMap;
    }
}
