/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.brentvatne.exoplayer;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;

/**
 * A {@link FrameLayout} that resizes itself to match a specified aspect ratio.
 */
public final class AspectRatioFrameLayout extends FrameLayout {

    /**
     * The {@link FrameLayout} will not resize itself if the fractional difference between its natural
     * aspect ratio and the requested aspect ratio falls below this threshold.
     * <p>
     * This tolerance allows the view to occupy the whole of the screen when the requested aspect
     * ratio is very close, but not exactly equal to, the aspect ratio of the screen. This may reduce
     * the number of view layers that need to be composited by the underlying system, which can help
     * to reduce power consumption.
     */
    private static final float MAX_ASPECT_RATIO_DEFORMATION_FRACTION = 0.01f;

    private float videoAspectRatio;
    private @ResizeMode.Mode int resizeMode = ResizeMode.RESIZE_MODE_FIT;

    public AspectRatioFrameLayout(Context context) {
        this(context, null);
    }

    public AspectRatioFrameLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    /**
     * Set the aspect ratio that this view should satisfy.
     *
     * @param widthHeightRatio The width to height ratio.
     */
    public void setAspectRatio(float widthHeightRatio) {
        if (this.videoAspectRatio != widthHeightRatio) {
            this.videoAspectRatio = widthHeightRatio;
            requestLayout();
        }
    }

    /**
     * Get the aspect ratio that this view should satisfy.
     *
     * @return widthHeightRatio The width to height ratio.
     */
    public float getAspectRatio() {
        return videoAspectRatio;
    }

    public void invalidateAspectRatio() {
        videoAspectRatio = 0;
    }

    /**
     * Sets the resize mode which can be of value {@link ResizeMode.Mode}
     *
     * @param resizeMode The resize mode.
     */
    public void setResizeMode(@ResizeMode.Mode int resizeMode) {
        if (this.resizeMode != resizeMode) {
            this.resizeMode = resizeMode;
            requestLayout();
        }
    }

    /**
     * Gets the resize mode which can be of value {@link ResizeMode.Mode}
     *
     * @return resizeMode The resize mode.
     */
    public @ResizeMode.Mode int getResizeMode() {
        return resizeMode;
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        if (videoAspectRatio == 0) {
            // Aspect ratio not set.
            return;
        }

        int measuredWidth = getMeasuredWidth();
        int measuredHeight = getMeasuredHeight();
        int width = measuredWidth;
        int height = measuredHeight;

        float viewAspectRatio = (float) measuredWidth / measuredHeight;
        float aspectDeformation = videoAspectRatio / viewAspectRatio - 1;
        if (Math.abs(aspectDeformation) <= MAX_ASPECT_RATIO_DEFORMATION_FRACTION) {
            // We're within the allowed tolerance.
            return;
        }

        switch (resizeMode) {
            case ResizeMode.RESIZE_MODE_FIXED_WIDTH:
                height = (int) (measuredWidth / videoAspectRatio);
                break;
            case ResizeMode.RESIZE_MODE_FIXED_HEIGHT:
                width = (int) (measuredHeight * videoAspectRatio);
                break;
            case ResizeMode.RESIZE_MODE_FILL:
                // Do nothing width and height is the same as the view
                break;
            case ResizeMode.RESIZE_MODE_CENTER_CROP:
                width = (int) (measuredHeight * videoAspectRatio);

                // Scale video if it doesn't fill the measuredWidth
                if (width < measuredWidth) {
                    float scaleFactor = (float) measuredWidth / width;
                    width = (int) (width * scaleFactor);
                    height = (int) (measuredHeight * scaleFactor);
                }
                break;
            default:
                if (aspectDeformation > 0) {
                    height = (int) (measuredWidth / videoAspectRatio);
                } else {
                    width = (int) (measuredHeight * videoAspectRatio);
                }
                break;
        }
        super.onMeasure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY));
    }

}
