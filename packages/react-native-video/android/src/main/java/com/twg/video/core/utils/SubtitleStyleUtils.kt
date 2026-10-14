package com.twg.video.core.utils

import android.graphics.Color
import android.view.View
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.CaptionStyleCompat
import androidx.media3.ui.SubtitleView
import com.margelo.nitro.video.SubtitleEdgeType
import com.margelo.nitro.video.SubtitleStyle
import java.util.WeakHashMap

@UnstableApi
object SubtitleStyleUtils {
  // SubtitleView.setBottomPaddingFraction() only affects cues whose own `line` is completely
  // unset - real WebVTT/SRT cues (including a plain cue with no "line:" setting at all) carry an
  // explicit default line (e.g. WebVTT's implicit "last line", line=-1), which bypasses it
  // entirely and renders flush to the bottom regardless. Real view padding on the rendering
  // child, by contrast, shrinks the bounding box every cue positions itself within, so it works
  // uniformly no matter how (or whether) a cue sets its own line. Tracked per-view so the
  // fraction survives being recomputed in pixels whenever the view's size changes.
  private val bottomPaddingFractions = WeakHashMap<SubtitleView, Float>()
  private val layoutListenerAttached = WeakHashMap<SubtitleView, Boolean>()

  /**
   * Applies a [SubtitleStyle] to a [SubtitleView].
   * Any field left unset falls back to [CaptionStyleCompat.DEFAULT] / the view's own default size,
   * so a partially-specified style doesn't clobber the rest of the platform defaults.
   */
  fun apply(subtitleView: SubtitleView, style: SubtitleStyle) {
    subtitleView.setStyle(toCaptionStyle(style))
    subtitleView.setFractionalTextSize(
      SubtitleView.DEFAULT_TEXT_SIZE_FRACTION * (style.fontScale?.toFloat() ?: 1f)
    )

    val fraction = style.bottomPadding?.toFloat() ?: SubtitleView.DEFAULT_BOTTOM_PADDING_FRACTION
    // Disable the native fraction entirely - we apply it ourselves as real view padding below,
    // so the rare cue that genuinely has an unset line doesn't get padded twice.
    subtitleView.setBottomPaddingFraction(0f)
    bottomPaddingFractions[subtitleView] = fraction
    applyBottomPaddingPx(subtitleView, fraction)
    ensureLayoutListener(subtitleView)
  }

  private fun ensureLayoutListener(subtitleView: SubtitleView) {
    if (layoutListenerAttached[subtitleView] == true) return
    layoutListenerAttached[subtitleView] = true
    subtitleView.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
      if ((bottom - top) != (oldBottom - oldTop)) {
        bottomPaddingFractions[subtitleView]?.let { applyBottomPaddingPx(subtitleView, it) }
      }
    }
  }

  private fun applyBottomPaddingPx(subtitleView: SubtitleView, fraction: Float) {
    val output = subtitleView.getChildAt(0) as? View ?: return
    val height = subtitleView.height
    if (height <= 0) return
    val bottomPx = (fraction * height).toInt()
    output.setPadding(output.paddingLeft, output.paddingTop, output.paddingRight, bottomPx)
  }

  private fun toCaptionStyle(style: SubtitleStyle): CaptionStyleCompat {
    val default = CaptionStyleCompat.DEFAULT
    return CaptionStyleCompat(
      parseColor(style.foregroundColor) ?: default.foregroundColor,
      parseColor(style.backgroundColor) ?: default.backgroundColor,
      parseColor(style.windowColor) ?: default.windowColor,
      toEdgeType(style.edgeType) ?: default.edgeType,
      parseColor(style.edgeColor) ?: default.edgeColor,
      default.typeface
    )
  }

  /**
   * Accepts `#RRGGBB` or `#AARRGGBB` (alpha-first, matching [Color.parseColor]).
   * Returns null (falling back to the platform default) rather than crashing on a malformed value.
   */
  private fun parseColor(color: String?): Int? {
    if (color == null) return null
    return try {
      Color.parseColor(color)
    } catch (e: IllegalArgumentException) {
      null
    }
  }

  private fun toEdgeType(edgeType: SubtitleEdgeType?): Int? {
    return when (edgeType) {
      SubtitleEdgeType.NONE -> CaptionStyleCompat.EDGE_TYPE_NONE
      SubtitleEdgeType.OUTLINE -> CaptionStyleCompat.EDGE_TYPE_OUTLINE
      SubtitleEdgeType.DROPSHADOW -> CaptionStyleCompat.EDGE_TYPE_DROP_SHADOW
      SubtitleEdgeType.RAISED -> CaptionStyleCompat.EDGE_TYPE_RAISED
      SubtitleEdgeType.DEPRESSED -> CaptionStyleCompat.EDGE_TYPE_DEPRESSED
      null -> null
    }
  }
}
