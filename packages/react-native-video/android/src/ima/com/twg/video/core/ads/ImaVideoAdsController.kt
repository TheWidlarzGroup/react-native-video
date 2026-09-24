package com.twg.video.core.ads

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.annotation.MainThread
import androidx.media3.common.AdViewProvider
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.ima.ImaAdsLoader
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.ads.AdsMediaSource
import com.google.ads.interactivemedia.v3.api.Ad
import com.google.ads.interactivemedia.v3.api.AdError
import com.google.ads.interactivemedia.v3.api.AdErrorEvent as ImaAdErrorEvent
import com.google.ads.interactivemedia.v3.api.AdEvent
import com.google.ads.interactivemedia.v3.api.AdPodInfo
import com.google.ads.interactivemedia.v3.api.ImaSdkFactory
import com.margelo.nitro.video.AdBreakEvent
import com.margelo.nitro.video.AdBreakKind
import com.margelo.nitro.video.AdErrorEvent
import com.margelo.nitro.video.AdInfo
import com.margelo.nitro.video.AdProgressInfo
import com.margelo.nitro.video.HybridVideoPlayerEventEmitter
import com.margelo.nitro.video.VideoAdState
import com.margelo.nitro.video.VideoAdsConfig

/**
 * Real Google IMA client-side ad insertion, backed by `androidx.media3:media3-exoplayer-ima`.
 *
 * Only compiled when `RNVideo_useExoplayerIma=true` (see `android/build.gradle`); everything
 * outside this source set talks to [VideoAdsController] instead, so the base library never
 * references an IMA class.
 *
 * All methods must be called on the main thread - `ImaAdsLoader` asserts its own looper.
 */
@UnstableApi
class ImaVideoAdsController(
  private val context: Context,
  private val config: VideoAdsConfig,
  override val adsId: String,
  private val generation: Int,
  private val adViewProvider: AdViewProvider,
  private val host: VideoAdsHost
) : VideoAdsController {

  private companion object {
    const val TAG = "ImaVideoAdsController"
  }

  /**
   * The `DataSpec` IMA resolves the ad request from. A `data:` URI carries a pre-fetched
   * VAST/VMAP response (Media3's `ImaUtil.getAdsRequestForAdTagDataSpec` reads it through
   * `DataSchemeDataSource` and calls `AdsRequest.setAdsResponse`); anything else is passed
   * straight through as `AdsRequest.setAdTagUrl`.
   */
  private val adTagDataSpec: DataSpec = buildAdTagDataSpec(config)

  /**
   * The most recent `Ad` IMA reported. IMA's `AD_BREAK_STARTED` / `AD_BREAK_ENDED` /
   * `AD_PROGRESS` events don't always carry the `Ad` themselves, but they always follow a
   * `LOADED`/`STARTED` for the same pod, so this is real SDK data rather than a guess.
   */
  private var lastAd: Ad? = null

  /**
   * Whether an ad break is currently open, so a break boundary is reported exactly once.
   *
   * Verified on media3 1.9.1 + IMA SDK 3.38.0: this integration dispatches
   * `CONTENT_PAUSE_REQUESTED` / `CONTENT_RESUME_REQUESTED` around each break and never
   * `AD_BREAK_STARTED` / `AD_BREAK_ENDED`. Both pairs are handled, deduplicated through this
   * flag, so the events stay correct either way.
   */
  private var adBreakOpen = false

  private var released = false

  private val adEventListener = AdEvent.AdEventListener { event -> handleAdEvent(event) }

  private val adErrorListener = ImaAdErrorEvent.AdErrorListener { event -> handleAdError(event.error) }

  private val adsLoader: ImaAdsLoader = ImaAdsLoader.Builder(context)
    .apply {
      setAdEventListener(adEventListener)
      setAdErrorListener(adErrorListener)

      val settings = ImaSdkFactory.getInstance().createImaSdkSettings()
      config.language?.let { settings.setLanguage(it) }
      config.ppid?.let { settings.setPpid(it) }
      setImaSdkSettings(settings)

      config.vastLoadTimeoutMs?.let { setVastLoadTimeoutMs(it.toInt()) }
      config.mediaLoadTimeoutMs?.let { setMediaLoadTimeoutMs(it.toInt()) }
      // Keep IMA's own preload timeout aligned with our fail-open watchdog so the SDK gives
      // up at roughly the same time we stop gating content.
      config.adRequestTimeoutMs?.let { setAdPreloadTimeoutMs(it.toLong()) }
    }
    .build()

  /**
   * Ad creatives are always played with a bare `DefaultMediaSourceFactory`: no DRM session
   * manager provider is ever attached, so the content's DRM configuration cannot leak onto
   * an ad creative.
   */
  private val adMediaSourceFactory = DefaultMediaSourceFactory(context)

  override val mediaSourceWrapper = AdsMediaSourceWrapper { contentMediaSource, _ ->
    AdsMediaSource(
      contentMediaSource,
      adTagDataSpec,
      adsId,
      adMediaSourceFactory,
      adsLoader,
      adViewProvider
    )
  }

  @MainThread
  override fun attachPlayer(player: ExoPlayer) {
    adsLoader.setPlayer(player)
  }

  @MainThread
  override fun skipAd() {
    if (released) return
    adsLoader.skipAd()
  }

  @MainThread
  override fun detachPlayer() {
    if (released) return
    adsLoader.setPlayer(null)
  }

  @MainThread
  override fun release() {
    if (released) return
    released = true
    adsLoader.release()
  }

  // MARK: - IMA -> Nitro event mapping

  private fun handleAdEvent(event: AdEvent) {
    if (released || !host.isCurrentGeneration(generation)) return

    event.ad?.let { lastAd = it }
    val emitter = host.adEventEmitter

    when (event.type) {
      AdEvent.AdEventType.AD_BREAK_STARTED,
      AdEvent.AdEventType.CONTENT_PAUSE_REQUESTED -> openAdBreak(emitter)

      AdEvent.AdEventType.STARTED -> {
        host.onAdStateChanged(VideoAdState.PLAYING)
        lastAd?.let { emitter.onAdStart(it.toAdInfo()) }
      }

      AdEvent.AdEventType.AD_PROGRESS -> {
        val progress = event.adProgressInfo ?: return
        val podIndex = lastAd?.adPodInfo?.podIndex ?: return
        emitter.onAdProgress(
          AdProgressInfo(
            currentTime = progress.currentTime,
            duration = progress.duration,
            adPodIndex = podIndex.toDouble(),
            totalAdsInPod = progress.totalAds.toDouble()
          )
        )
      }

      AdEvent.AdEventType.COMPLETED -> lastAd?.let { emitter.onAdComplete(it.toAdInfo()) }

      AdEvent.AdEventType.SKIPPED -> lastAd?.let { emitter.onAdSkipped(it.toAdInfo()) }

      AdEvent.AdEventType.CLICKED -> emitter.onAdClicked()

      AdEvent.AdEventType.AD_BREAK_ENDED,
      AdEvent.AdEventType.CONTENT_RESUME_REQUESTED -> closeAdBreak(emitter)

      AdEvent.AdEventType.ALL_ADS_COMPLETED -> {
        closeAdBreak(emitter)
        emitter.onAllAdsCompleted()
      }

      else -> Unit
    }
  }

  private fun openAdBreak(emitter: HybridVideoPlayerEventEmitter) {
    host.onAdStateChanged(VideoAdState.PLAYING)
    if (adBreakOpen) return
    adBreakOpen = true
    podInfo()?.let { emitter.onAdBreakStart(it.toAdBreakEvent()) }
  }

  private fun closeAdBreak(emitter: HybridVideoPlayerEventEmitter) {
    if (adBreakOpen) {
      adBreakOpen = false
      podInfo()?.let { emitter.onAdBreakEnd(it.toAdBreakEvent()) }
    }
    host.onAdStateChanged(VideoAdState.CONTENT)
    host.onAdActivityEnded()
  }

  private fun handleAdError(error: AdError) {
    if (released || !host.isCurrentGeneration(generation)) return

    Log.w(TAG, "IMA ad error (${error.errorCodeNumber}): ${error.message}")

    host.adEventEmitter.onAdError(
      AdErrorEvent(
        code = error.errorCodeNumber.toDouble(),
        message = error.message ?: error.toString(),
        // Every AdError surfaced by ImaAdsLoader ends the affected ad break: AdsMediaSource
        // marks the ad group as errored and content plays on. That is exactly what
        // `fatal` documents ("content will now play").
        fatal = true
      )
    )

    host.onAdStateChanged(VideoAdState.FAILED)
    host.onAdActivityEnded()
  }

  private fun podInfo(): AdPodInfo? = lastAd?.adPodInfo

  private fun AdPodInfo.toAdBreakEvent(): AdBreakEvent = AdBreakEvent(
    kind = podIndexToBreakKind(podIndex),
    totalAds = totalAds.toDouble()
  )

  private fun Ad.toAdInfo(): AdInfo = AdInfo(
    adId = adId ?: "",
    title = title,
    // IMA reports a negative duration when it isn't known; the JS contract is NaN.
    duration = if (duration < 0) Double.NaN else duration,
    skippable = isSkippable,
    skipTimeOffset = skipTimeOffset,
    adPodIndex = adPodInfo?.podIndex?.toDouble() ?: 0.0,
    totalAdsInPod = adPodInfo?.totalAds?.toDouble() ?: 0.0,
    advertiserName = advertiserName
  )

  private fun podIndexToBreakKind(podIndex: Int): AdBreakKind = when {
    // IMA: 0 is the pre-roll, -1 is the post-roll, everything else is a mid-roll.
    podIndex == 0 -> AdBreakKind.PREROLL
    podIndex < 0 -> AdBreakKind.POSTROLL
    else -> AdBreakKind.MIDROLL
  }

  private fun buildAdTagDataSpec(config: VideoAdsConfig): DataSpec {
    val adTagUrl = requireNotNull(config.adTagUrl) { "VideoAdsConfig requires adTagUrl" }
    return DataSpec(Uri.parse(adTagUrl))
  }
}
