package com.brentvatne.entity;

import java.util.Map;

public class RelatedVideo {

    private final String title;
    private final String subtitle;
    private final String thumbnailUrl;
    private final Map<String, Object> relatedVideoMap;

    public RelatedVideo(
            String title,
            String subtitle,
            String thumbnailUrl,
            Map<String, Object> relatedVideoMap) {
        this.title = title;
        this.subtitle = subtitle;
        this.thumbnailUrl = thumbnailUrl;
        this.relatedVideoMap = relatedVideoMap;
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
