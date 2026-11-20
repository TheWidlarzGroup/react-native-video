package com.twg.video.core.ads

import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.MainThread
import androidx.media3.common.AdOverlayInfo
import androidx.media3.common.AdViewProvider
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import java.lang.ref.WeakReference

/**
 * An [AdViewProvider] whose ad container survives `PlayerView` swaps.
 *
 * Media3's `AdsMediaSource`/`AdTagLoader` reads [getAdViewGroup] exactly once, at
 * `AdsLoader.start()` time, to build IMA's internal `AdDisplayContainer`. There is no API to
 * hand IMA a different `ViewGroup` afterwards. This player, however, moves a single
 * `ExoPlayer` between `PlayerView` instances (PiP, fullscreen, feed cell recycling) via
 * `PlayerView.switchTargetView`, so the `PlayerView` that was attached when the ad session
 * started is frequently not the one on screen when the ad actually renders.
 *
 * So this class owns one identity-stable [FrameLayout] for the whole ad session and
 * *re-parents that same instance* into whichever `PlayerView`'s `overlayFrameLayout` is
 * currently attached. IMA keeps the reference it captured; only the container's parent
 * changes.
 */
@UnstableApi
class SwappableAdViewProvider(context: Context) : AdViewProvider {

  /**
   * The one container handed to IMA. Never recreated for the lifetime of this provider.
   */
  private val container: FrameLayout = FrameLayout(context.applicationContext).apply {
    layoutParams = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    )
  }

  private var attachedPlayerView: WeakReference<PlayerView>? = null

  override fun getAdViewGroup(): ViewGroup = container

  /**
   * Friendly obstructions (playback controls etc.) belong to the currently attached
   * `PlayerView`, which already computes them - delegate rather than duplicating.
   */
  override fun getAdOverlayInfos(): List<AdOverlayInfo> =
    attachedPlayerView?.get()?.adOverlayInfos ?: emptyList()

  /**
   * Moves the ad container into [playerView]'s overlay frame. Idempotent, and safe to call
   * on every `movePlayerToVideoView`.
   */
  @MainThread
  fun attachTo(playerView: PlayerView?) {
    if (playerView == null) {
      detach()
      return
    }

    // `overlayFrameLayout` is only non-null when the inflated PlayerView layout declares
    // `@id/exo_overlay`; media3's default `exo_player_view` layout (which this library uses -
    // neither player_view_surface.xml nor player_view_texture.xml overrides
    // app:player_layout_id) does declare it.
    val overlay = playerView.overlayFrameLayout ?: return

    val currentParent = container.parent
    if (currentParent === overlay) {
      attachedPlayerView = WeakReference(playerView)
      return
    }

    (currentParent as? ViewGroup)?.removeView(container)
    overlay.addView(container)
    attachedPlayerView = WeakReference(playerView)
  }

  /** Removes the ad container from whatever `PlayerView` currently hosts it. */
  @MainThread
  fun detach() {
    (container.parent as? ViewGroup)?.removeView(container)
    attachedPlayerView = null
  }
}
