/**
 * Configuration for native Google IMA client-side ad insertion.
 * Attached at the source level (see {@link VideoConfig.ads}) so it swaps
 * atomically whenever the source is replaced.
 */
export type VideoAdsConfig = {
  /**
   * VAST or VMAP ad tag URL.
   */
  adTagUrl?: string;
  /**
   * When true, ads are requested as soon as the player initializes.
   * When false (default), ads are only requested after an explicit
   * {@link VideoPlayerBase.activateAds} call.
   *
   * @note Use `false` (the default) for players in a scrollable feed where
   * multiple players may be preloaded/mounted at once but only one is
   * actually active/visible - this prevents every preloaded player from
   * independently requesting ads.
   * @default false
   */
  autoActivate?: boolean;
  /**
   * The language to request ads in (e.g. 'en', 'es').
   */
  language?: string;
  /**
   * A publisher-provided identifier for frequency capping / targeting.
   */
  ppid?: string;
  /**
   * Timeout in milliseconds for the VAST ad tag request.
   */
  vastLoadTimeoutMs?: number;
  /**
   * Timeout in milliseconds for loading ad media once an ad has been selected.
   */
  mediaLoadTimeoutMs?: number;
  /**
   * Fail-open watchdog: if no ad decision is reached within this time, the
   * gate opens and content plays as if no ad was available. This is a
   * safety net independent of {@link vastLoadTimeoutMs}/{@link mediaLoadTimeoutMs},
   * which are passed to the ad SDK itself.
   * @default 8000
   */
  adRequestTimeoutMs?: number;
};

/**
 * The state of the native ad/playback gate.
 * @param idle - No ads are configured for the current source.
 * @param activating - Ads are configured but have not been activated yet.
 * @param requesting - An ad request is in flight; content playback is gated.
 * @param playing - An ad is currently playing; content playback is gated.
 * @param content - The ad decision has resolved (with or without an ad played); content is allowed to play.
 * @param failed - The ad request/playback failed; content is allowed to play (fail-open).
 */
export type VideoAdState =
  | 'idle'
  | 'activating'
  | 'requesting'
  | 'playing'
  | 'content'
  | 'failed';

export type AdBreakKind = 'preRoll' | 'midRoll' | 'postRoll';

export interface AdInfo {
  adId: string;
  title?: string;
  /**
   * The duration of the ad in seconds. NaN if unknown.
   */
  duration: number;
  skippable: boolean;
  /**
   * The time in seconds at which the ad becomes skippable. -1 if not skippable.
   */
  skipTimeOffset: number;
  adPodIndex: number;
  totalAdsInPod: number;
  advertiserName?: string;
}

export interface AdsResolvedEvent {
  /**
   * Whether at least one ad will play for this ad break decision.
   */
  hasAds: boolean;
  /**
   * Milliseconds elapsed between activation and this decision resolving.
   */
  elapsedMs: number;
}

export interface AdBreakEvent {
  kind: AdBreakKind;
  /**
   * The number of ads in this ad break/pod.
   */
  totalAds: number;
}

export interface AdProgressInfo {
  currentTime: number;
  duration: number;
  adPodIndex: number;
  totalAdsInPod: number;
}

export interface AdErrorEvent {
  code: number;
  message: string;
  /**
   * Whether this error is fatal to the ad break (content will now play).
   */
  fatal: boolean;
}
