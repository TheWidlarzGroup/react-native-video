package com.brentvatne.exoplayer;
import com.brentvatne.ReactBridgeUtils;
import com.facebook.react.bridge.ReadableMap;

/**
 * Helper file to parse SubtitleStyle prop and build a dedicated class
 */
public class SubtitleStyle {
    private static final String PROP_FONT_SIZE_TRACK = "fontSize";
    private static final String PROP_PADDING_BOTTOM = "paddingBottom";
    private static final String PROP_PADDING_TOP = "paddingTop";
    private static final String PROP_PADDING_LEFT = "paddingLeft";
    private static final String PROP_PADDING_RIGHT = "paddingRight";

    private int fontSize = -1;
    private int paddingLeft = 0;
    private int paddingRight = 0;
    private int paddingTop = 0;
    private int paddingBottom = 0;

    private SubtitleStyle() {}

    int getFontSize() {return fontSize;}
    int getPaddingBottom() {return paddingBottom;}
    int getPaddingTop() {return paddingTop;}
    int getPaddingLeft() {return paddingLeft;}
    int getPaddingRight() {return paddingRight;}

    public static SubtitleStyle parse(ReadableMap src) {
        SubtitleStyle subtitleStyle = new SubtitleStyle();
        subtitleStyle.fontSize = ReactBridgeUtils.safeGetInt(src, PROP_FONT_SIZE_TRACK, -1);
        subtitleStyle.paddingBottom = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_BOTTOM, 0);
        subtitleStyle.paddingTop = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_TOP, 0);
        subtitleStyle.paddingLeft = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_LEFT, 0);
        subtitleStyle.paddingRight = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_RIGHT, 0);
        return subtitleStyle;
    }
}
