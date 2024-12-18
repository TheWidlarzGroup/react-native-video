package com.brentvatne.exoplayer

import android.content.Context
import android.widget.FrameLayout
import androidx.media3.common.Format
import com.brentvatne.common.api.ResizeMode
import kotlin.math.abs

/**
 * A {@link FrameLayout} that resizes itself to match a specified aspect ratio.
 */
class AspectRatioFrameLayout(context: Context) : FrameLayout(context) {
    /**
     * The {@link FrameLayout} will not resize itself if the fractional difference between its natural
     * aspect ratio and the requested aspect ratio falls below this threshold.
     * <p>
     * This tolerance allows the view to occupy the whole of the screen when the requested aspect
     * ratio is very close, but not exactly equal to, the aspect ratio of the screen. This may reduce
     * the number of view layers that need to be composited by the underlying system, which can help
     * to reduce power consumption.
     */
    companion object {
        private const val MAX_ASPECT_RATIO_DEFORMATION_FRACTION = 0.01f
    }

    var videoAspectRatio: Float = 0f
        set(value) {
            if (value != field) {
                field = value
                requestLayout()
            }
        }

    var resizeMode: Int = ResizeMode.RESIZE_MODE_FIT
        set(value) {
            if (value != field) {
                field = value
                requestLayout()
            }
        }

    fun invalidateAspectRatio() {
        videoAspectRatio = 0f
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        if (videoAspectRatio == 0f) {
            // Aspect ratio not set.
            return
        }

        val measuredWidth: Int = measuredWidth
        val measuredHeight: Int = measuredHeight
        var width: Int = measuredWidth
        var height: Int = measuredHeight

        val viewAspectRatio: Float = measuredWidth.toFloat() / measuredHeight
        val aspectDeformation: Float = videoAspectRatio / viewAspectRatio - 1
        if (abs(aspectDeformation) <= MAX_ASPECT_RATIO_DEFORMATION_FRACTION) {
            // We're within the allowed tolerance.
            return
        }

        when (resizeMode) {
            ResizeMode.RESIZE_MODE_FIXED_WIDTH -> height = (measuredWidth / videoAspectRatio).toInt()

            ResizeMode.RESIZE_MODE_FIXED_HEIGHT -> width = ((measuredHeight * videoAspectRatio).toInt())

            ResizeMode.RESIZE_MODE_FILL -> {
                // Do nothing width and height is the same as the view
            }

            ResizeMode.RESIZE_MODE_CENTER_CROP -> {
                width = (measuredHeight * videoAspectRatio).toInt()

                // Scale video if it doesn't fill the measuredWidth
                if (width < measuredWidth) {
                    val scaleFactor: Float = measuredWidth.toFloat() / width
                    width = (scaleFactor * width).toInt()
                    height = (scaleFactor * height).toInt()
                }
            }

            else -> {
                if (aspectDeformation > 0) {
                    height = (measuredWidth / videoAspectRatio).toInt()
                } else {
                    width = (measuredHeight * videoAspectRatio).toInt()
                }
            }
        }
        super.onMeasure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
    }

    fun updateAspectRatio(format: Format) {
        // There are weird cases when video height and width did not change with rotation so we need change aspect ration to fix it
        when (format.rotationDegrees) {
            90, 270 -> videoAspectRatio = if (format.width == 0) 1f else (format.height * format.pixelWidthHeightRatio) / format.width
            else -> videoAspectRatio = if (format.height == 0) 1f else (format.width * format.pixelWidthHeightRatio) / format.height
        }
    }
}
