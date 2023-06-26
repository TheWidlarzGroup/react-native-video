package com.brentvatne.entity;

import java.util.Map;

public class RelatedVideo {

    private static final String KEY_ID = "id";
    private static final String KEY_TYPE = "type";

    private int id;
    private final String title;
    private final String subtitle;
    private final long duration;
    private final String thumbnailUrl;
    private String type;
    private final Map<String, Object> relatedVideoMap;

    public RelatedVideo(
            String title,
            String subtitle,
            long duration,
            String thumbnailUrl,
            Map<String, Object> relatedVideoMap) {
        this.title = title;
        this.subtitle = subtitle;
        this.duration = duration;
        this.thumbnailUrl = thumbnailUrl;
        this.relatedVideoMap = relatedVideoMap;

        if (relatedVideoMap != null) {
            this.id = (int) ((double) relatedVideoMap.get(KEY_ID));
            this.type = (String) relatedVideoMap.get(KEY_TYPE);
        }
    }

    public int getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public long getDuration() {
        return duration;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getType() {
        return type;
    }

    public Map<String, Object> getRelatedVideoMap() {
        return relatedVideoMap;
    }
}
