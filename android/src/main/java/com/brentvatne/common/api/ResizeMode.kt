package com.brentvatne.common.api

import androidx.annotation.IntDef
import java.lang.annotation.Retention
import java.lang.annotation.RetentionPolicy

internal object ResizeMode {
    /**
     * Either the width or height is decreased to obtain the desired aspect ratio.
     */
    const val RESIZE_MODE_FIT = 0

    /**
     * The width is fixed and the height is increased or decreased to obtain the desired aspect ratio.
     */
    const val RESIZE_MODE_FIXED_WIDTH = 1

    /**
     * The height is fixed and the width is increased or decreased to obtain the desired aspect ratio.
     */
    const val RESIZE_MODE_FIXED_HEIGHT = 2

    /**
     * The height and the width is increased or decreased to fit the size of the view.
     */
    const val RESIZE_MODE_FILL = 3

    /**
     * Keeps the aspect ratio but takes up the view's size.
     */
    const val RESIZE_MODE_CENTER_CROP = 4

    @JvmStatic
    @Mode
    fun toResizeMode(ordinal: Int): Int =
        when (ordinal) {
            RESIZE_MODE_FIXED_WIDTH -> RESIZE_MODE_FIXED_WIDTH
            RESIZE_MODE_FIXED_HEIGHT -> RESIZE_MODE_FIXED_HEIGHT
            RESIZE_MODE_FILL -> RESIZE_MODE_FILL
            RESIZE_MODE_CENTER_CROP -> RESIZE_MODE_CENTER_CROP
            RESIZE_MODE_FIT -> RESIZE_MODE_FIT
            else -> RESIZE_MODE_FIT
        }

    @Retention(RetentionPolicy.SOURCE)
    @IntDef(
        RESIZE_MODE_FIT,
        RESIZE_MODE_FIXED_WIDTH,
        RESIZE_MODE_FIXED_HEIGHT,
        RESIZE_MODE_FILL,
        RESIZE_MODE_CENTER_CROP
    )
    annotation class Mode
}
