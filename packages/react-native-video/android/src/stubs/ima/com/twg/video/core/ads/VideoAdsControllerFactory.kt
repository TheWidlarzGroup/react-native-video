package com.twg.video.core.ads

import android.content.Context
import androidx.media3.common.AdViewProvider
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.VideoAdsConfig

/**
 * No-IMA variant, compiled when `RNVideo_useExoplayerIma=false` (the default).
 *
 * `media3-exoplayer-ima` is not on the classpath in this configuration, so
 * [create] always returns `null` and `HybridVideoPlayer.activateAds()` fails open:
 * it emits `onAdError` and plays content unwrapped.
 *
 * Keep the signature identical to `src/ima`'s copy.
 */
@UnstableApi
object VideoAdsControllerFactory {
  /** Whether this build links `androidx.media3:media3-exoplayer-ima`. */
  const val IS_AVAILABLE = false

  @Suppress("UNUSED_PARAMETER")
  fun create(
    context: Context,
    config: VideoAdsConfig,
    adsId: String,
    generation: Int,
    adViewProvider: AdViewProvider,
    host: VideoAdsHost
  ): VideoAdsController? = null
}
