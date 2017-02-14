package com.brentvatne.exoplayer;

import android.support.annotation.IntDef;

import java.lang.annotation.Retention;

import static java.lang.annotation.RetentionPolicy.SOURCE;

class ResizeMode {

    /**
     * Either the width or height is decreased to obtain the desired aspect ratio.
     */
    static final int RESIZE_MODE_FIT = 0;
    /**
     * The width is fixed and the height is increased or decreased to obtain the desired aspect ratio.
     */
    static final int RESIZE_MODE_FIXED_WIDTH = 1;
    /**
     * The height is fixed and the width is increased or decreased to obtain the desired aspect ratio.
     */
    static final int RESIZE_MODE_FIXED_HEIGHT = 2;
    /**
     * The height and the width is increased or decreased to fit the size of the view.
     */
    static final int RESIZE_MODE_FILL = 3;
    /**
     * Keeps the aspect ratio but takes up the view's size.
     */
    static final int RESIZE_MODE_CENTER_CROP = 4;

    @Retention(SOURCE)
    @IntDef({
            RESIZE_MODE_FIT,
            RESIZE_MODE_FIXED_WIDTH,
            RESIZE_MODE_FIXED_HEIGHT,
            RESIZE_MODE_FILL,
            RESIZE_MODE_CENTER_CROP
    })
    public @interface Mode {
    }

    @ResizeMode.Mode static int toResizeMode(int ordinal) {
        switch (ordinal) {
            case ResizeMode.RESIZE_MODE_FIXED_WIDTH:
                return ResizeMode.RESIZE_MODE_FIXED_WIDTH;

            case ResizeMode.RESIZE_MODE_FIXED_HEIGHT:
                return ResizeMode.RESIZE_MODE_FIXED_HEIGHT;

            case ResizeMode.RESIZE_MODE_FILL:
                return ResizeMode.RESIZE_MODE_FILL;

            case ResizeMode.RESIZE_MODE_CENTER_CROP:
                return ResizeMode.RESIZE_MODE_CENTER_CROP;

            case ResizeMode.RESIZE_MODE_FIT:
            default:
                return ResizeMode.RESIZE_MODE_FIT;
        }
    }

}