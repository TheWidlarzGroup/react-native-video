package com.twg.video.core.extensions

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import com.margelo.nitro.video.ResizeMode

@OptIn(UnstableApi::class)
/**
 * Converts a [ResizeMode] to a [AspectRatioFrameLayout] resize mode.
 * @return The corresponding [AspectRatioFrameLayout] resize mode.
 */
fun ResizeMode.toAspectRatioFrameLayout(): Int {
  return when (this) {
    ResizeMode.CONTAIN -> AspectRatioFrameLayout.RESIZE_MODE_FIT
    ResizeMode.COVER -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
    ResizeMode.STRETCH -> AspectRatioFrameLayout.RESIZE_MODE_FILL
    ResizeMode.NONE -> AspectRatioFrameLayout.RESIZE_MODE_FIT
  }
}
