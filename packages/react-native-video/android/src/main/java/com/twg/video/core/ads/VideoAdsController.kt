package com.twg.video.core.ads

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.video.HybridVideoPlayerEventEmitter
import com.margelo.nitro.video.VideoAdState

/**
 * Terminal, optional wrapping step handed to
 * [com.twg.video.core.player.buildMediaSource].
 *
 * The content [MediaSource] is built exactly as it always was (DASH/HLS/Default factory
 * selection, DRM session manager, plugin overrides); this hook is applied last and wraps
 * the finished content source in an `AdsMediaSource`.
 */
@UnstableApi
fun interface AdsMediaSourceWrapper {
  fun wrap(contentMediaSource: MediaSource, mediaItem: MediaItem): MediaSource
}

/**
 * Everything a [VideoAdsController] needs from the player that owns it.
 *
 * Implemented by `HybridVideoPlayer`. Every callback coming out of the ad SDK must first
 * pass [isCurrentGeneration] - see the generation token documented on `HybridVideoPlayer`.
 */
interface VideoAdsHost {
  /**
   * `false` when [generation] belongs to an ad session that has already been superseded by
   * a source replacement, a `deactivateAds()` or a `release()`. Stale callbacks must not
   * touch any state.
   */
  fun isCurrentGeneration(generation: Int): Boolean

  /** Reports an ad-state transition. The host owns the canonical `adState`. */
  fun onAdStateChanged(state: VideoAdState)

  /** The emitter the controller pushes ad events through. */
  val adEventEmitter: HybridVideoPlayerEventEmitter

  /**
   * Called when an ad break finishes, all ads complete, or the ad session fails open -
   * i.e. when the "an ad is on screen" condition that gates Picture-in-Picture clears.
   */
  fun onAdActivityEnded()
}

/**
 * Platform-agnostic seam over the ad SDK. `HybridVideoPlayer` only ever talks to this
 * interface, so no IMA class is referenced outside the `src/ima` source set.
 */
@UnstableApi
interface VideoAdsController {
  /**
   * Opaque identifier this controller hands to the ad SDK. Includes the player's
   * generation token so a reused player never restores a previous session's ad state.
   */
  val adsId: String

  /**
   * Attaches the ExoPlayer to the ad loader.
   *
   * MUST be called before `player.prepare()` - Media3's `ImaAdsLoader.start()` asserts the
   * player is set.
   */
  fun attachPlayer(player: ExoPlayer)

  /** The wrapper that turns the content media source into an `AdsMediaSource`. */
  val mediaSourceWrapper: AdsMediaSourceWrapper

  /** Skips the current ad if it is skippable and past its skip offset. */
  fun skipAd()

  /** Detaches the player (`setPlayer(null)`). Must run before `player.release()`. */
  fun detachPlayer()

  /** Releases the ad loader. Must run after `player.release()`. */
  fun release()
}
