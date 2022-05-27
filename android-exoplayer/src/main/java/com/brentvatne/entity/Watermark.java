package com.brentvatne.entity;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;

/**
 * Entity that represents a watermark image.
 */
public class Watermark {
    /**
     * Position where the watermark should be rendered.
     */
    public enum Position {
        TOP_LEFT,
        TOP_RIGHT,
        BOTTOM_LEFT,
        BOTTOM_RIGHT
    }

    /**
     * The dimension that the scaling will be based on.
     *
     * Example: if the dimension is "width" and the sizeRatio is 0.2, then the watermark logo's
     * width needs to be scaled to the player view's width * 0.2 and the height is adjusted to
     * keep the original aspect ratio.
     */
    public enum Dimension {
        WIDTH,
        HEIGHT
    }

    private final @Nullable String url;
    private final @Nullable Position position;
    private final @Nullable Dimension dimension;
    private final float sizeRatio;

    public Watermark(
            @Nullable String url,
            @Nullable String position,
            @Nullable String dimension,
            float sizeRatio) {

        this.url = url;
        this.position = parsePosition(position);
        this.dimension = parseDimension(dimension);
        this.sizeRatio = sizeRatio;
    }

    @Nullable
    public String getUrl() {
        return url;
    }

    @Nullable
    public Position getPosition() {
        return position;
    }

    @Nullable
    public Dimension getDimension() {
        return dimension;
    }

    public float getSizeRatio() {
        return sizeRatio;
    }

    public boolean isAtTop() {
        return position != null && (position == Position.TOP_LEFT || position == Position.TOP_RIGHT);
    }

    public boolean isAtBottom() {
        return position != null && (position == Position.BOTTOM_LEFT || position == Position.BOTTOM_RIGHT);
    }

    @Override
    public String toString() {
        return "Watermark{" +
                "url='" + url + '\'' +
                ", position=" + position +
                ", dimension=" + dimension +
                ", sizeRatio=" + sizeRatio +
                '}';
    }

    public static boolean isValid(@Nullable Watermark watermark) {
        if (watermark == null) {
            return false;
        }
        return watermark.url != null
                && watermark.position != null
                && watermark.dimension != null
                && watermark.sizeRatio > 0f && watermark.sizeRatio <= 1f;
    }

    private static Position parsePosition(@Nullable String position) {
        if (position == null) {
            return null;
        }
        switch (position.toLowerCase()) {
            case "top_left":
                return Position.TOP_LEFT;
            case "top_right":
                return Position.TOP_RIGHT;
            case "bottom_left":
                return Position.BOTTOM_LEFT;
            case "bottom_right":
                return Position.BOTTOM_RIGHT;
            default:
                return null;
        }
    }

    private static Dimension parseDimension(@Nullable String dimension) {
        if (dimension == null) {
            return null;
        }
        switch (dimension.toLowerCase()) {
            case "width":
                return Dimension.WIDTH;
            case "height":
                return Dimension.HEIGHT;
            default:
                return null;
        }
    }

    @Nullable
    public static Watermark fromMap(ReadableMap metadata) {
        try {
            return new Watermark(
                    metadata.getString("logoUrl"),
                    metadata.getString("logoPosition"),
                    metadata.getString("logoStaticDimension"),
                    (float) metadata.getDouble("logoPlayerSizeRatio"));
        } catch (Exception e) {
            return null;
        }
    }
}
