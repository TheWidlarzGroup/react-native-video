package com.twg.video.core.extensions

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import com.margelo.nitro.video.VideoResizeMode

@OptIn(UnstableApi::class)
/**
 * Converts a [VideoResizeMode] to a [AspectRatioFrameLayout] resize mode.
 * @return The corresponding [AspectRatioFrameLayout] resize mode.
 */
fun VideoResizeMode.toAspectRatioFrameLayout(): Int {
  return when (this) {
    VideoResizeMode.CONTAIN -> AspectRatioFrameLayout.RESIZE_MODE_FIT
    VideoResizeMode.COVER -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
    VideoResizeMode.STRETCH -> AspectRatioFrameLayout.RESIZE_MODE_FILL
    VideoResizeMode.NONE -> AspectRatioFrameLayout.RESIZE_MODE_FIT
  }
}
