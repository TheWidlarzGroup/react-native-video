package com.twg.video.core.utils

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.media3.ui.PlayerView

object SmallVideoPlayerOptimizer {

  fun isSmallVideoPlayer(playerView: PlayerView): Boolean {
    // Check if the PlayerView dimensions are small enough to warrant optimizations
    val width = playerView.width
    val height = playerView.height

    // If view hasn't been measured yet, use layout params or return false
    if (width <= 0 || height <= 0) {
      val layoutParams = playerView.layoutParams
      if (layoutParams != null) {
        // Convert any specific dimensions to pixels if needed
        val widthPx = if (layoutParams.width > 0) layoutParams.width else playerView.measuredWidth
        val heightPx = if (layoutParams.height > 0) layoutParams.height else playerView.measuredHeight

        if (widthPx <= 0 || heightPx <= 0) return false

        return isSmallDimensions(widthPx, heightPx, playerView.context)
      }
      return false
    }

    return isSmallDimensions(width, height, playerView.context)
  }

  private fun isSmallDimensions(widthPx: Int, heightPx: Int, context: Context): Boolean {
    val density = context.resources.displayMetrics.density
    val widthDp = widthPx / density
    val heightDp = heightPx / density

    // Consider the video player "small" if width <= 400dp or height <= 300dp
    // These thresholds are more appropriate for actual video player sizes
    return widthDp <= 400 || heightDp <= 300
  }

  fun applyOptimizations(
    playerView: PlayerView,
    context: Context,
    isFullscreen: Boolean = false
  ) {
    playerView.post {
      try {
        if (isFullscreen) {
          // For fullscreen mode, use system defaults - no custom optimizations
          // Let ExoPlayer use its default controller timeout and styling
          return@post
        }

        // Only apply optimizations if the video player itself is small
        if (!isSmallVideoPlayer(playerView)) {
          return@post
        }

        val controllerView = playerView.findViewById<ViewGroup>(androidx.media3.ui.R.id.exo_controller)
        controllerView?.let { controller ->
          optimizeControlElementsForSmallPlayer(controller, context)
        }
      } catch (e: Exception) {
        Log.w("ReactNativeVideo", "Error applying small video player optimizations: ${e.message}")
      }
    }
  }

  private fun optimizeControlElementsForSmallPlayer(
    controller: ViewGroup,
    context: Context
  ) {
    val density = context.resources.displayMetrics.density
    val primaryButtonSize = (48 * density).toInt()
    val secondaryButtonSize = (44 * density).toInt()

    optimizeButtons(controller, primaryButtonSize, secondaryButtonSize)
    optimizeProgressBar(controller, context)
    optimizeTextElements(controller)
  }

  private fun optimizeButtons(
    container: ViewGroup,
    primarySize: Int,
    secondarySize: Int
  ) {
    for (i in 0 until container.childCount) {
      val child = container.getChildAt(i)
      when (child) {
        is ImageButton -> {
          val buttonSize = when (child.id) {
            androidx.media3.ui.R.id.exo_play_pause -> primarySize
            androidx.media3.ui.R.id.exo_fullscreen -> primarySize
            androidx.media3.ui.R.id.exo_settings -> primarySize
            androidx.media3.ui.R.id.exo_rew -> secondarySize
            androidx.media3.ui.R.id.exo_ffwd -> secondarySize
            androidx.media3.ui.R.id.exo_subtitle -> secondarySize
            androidx.media3.ui.R.id.exo_prev -> secondarySize
            androidx.media3.ui.R.id.exo_next -> secondarySize
            else -> secondarySize
          }

          val params = child.layoutParams
          params.width = buttonSize
          params.height = buttonSize
          child.layoutParams = params

          // Hide less essential buttons on small video players
          when (child.id) {
            androidx.media3.ui.R.id.exo_shuffle,
            androidx.media3.ui.R.id.exo_repeat_toggle,
            androidx.media3.ui.R.id.exo_vr -> {
              child.visibility = View.GONE
            }
          }
        }
        is ViewGroup -> {
          optimizeButtons(child, primarySize, secondarySize)
        }
      }
    }
  }

  private fun optimizeProgressBar(
    controller: ViewGroup,
    context: Context
  ) {
    val progressContainer = controller.findViewById<View>(androidx.media3.ui.R.id.exo_progress)
    progressContainer?.let { progress ->
      val params = progress.layoutParams as? ViewGroup.MarginLayoutParams
      params?.let {
        it.height = (4 * context.resources.displayMetrics.density).toInt()
        progress.layoutParams = it
      }
    }
  }

  private fun optimizeTextElements(
    controller: ViewGroup
  ) {
    val timeContainer = controller.findViewById<ViewGroup>(androidx.media3.ui.R.id.exo_time)
    timeContainer?.let { time ->
      val positionView = time.findViewById<View>(androidx.media3.ui.R.id.exo_position)
      val durationView = time.findViewById<View>(androidx.media3.ui.R.id.exo_duration)

      listOf(positionView, durationView).forEach { textView ->
        if (textView is android.widget.TextView) {
          textView.textSize = 12f
        }
      }
    }
  }
}
