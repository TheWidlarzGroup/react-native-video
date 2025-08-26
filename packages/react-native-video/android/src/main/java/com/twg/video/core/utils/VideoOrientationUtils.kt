package com.twg.video.core.utils

import com.margelo.nitro.video.VideoOrientation

object VideoOrientationUtils {
  fun fromWHR(width: Int?, height: Int?, rotation: Int?): VideoOrientation {
    if (width == 0 || height == 0 || height == null || width == null) return VideoOrientation.UNKNOWN

    if (width == height) return VideoOrientation.SQUARE

    // Check if video is portrait or landscape using natural size
    val isNaturalSizePortrait = height > width

    // If rotation is not available, use natural size to determine orientation
    if (rotation == null) {
      return if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
    }

    // Normalize rotation to 0-360 range
    val normalizedRotation = ((rotation % 360) + 360) % 360

    return when (normalizedRotation) {
      0 -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
      90 -> VideoOrientation.PORTRAIT
      180 -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT_UPSIDE_DOWN else VideoOrientation.LANDSCAPE_LEFT
      270 -> VideoOrientation.PORTRAIT_UPSIDE_DOWN
      else -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
    }
  }
}
