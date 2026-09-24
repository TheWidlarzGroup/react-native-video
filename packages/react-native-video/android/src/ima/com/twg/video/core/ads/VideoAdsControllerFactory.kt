package com.twg.video.core.ads

import android.content.Context
import androidx.media3.common.AdViewProvider
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.VideoAdsConfig

/**
 * IMA-enabled variant, compiled when `RNVideo_useExoplayerIma=true`.
 *
 * See `src/stubs/ima` for the variant compiled when the flag is off.
 */
@UnstableApi
object VideoAdsControllerFactory {
  /** Whether this build links `androidx.media3:media3-exoplayer-ima`. */
  const val IS_AVAILABLE = true

  fun create(
    context: Context,
    config: VideoAdsConfig,
    adsId: String,
    generation: Int,
    adViewProvider: AdViewProvider,
    host: VideoAdsHost
  ): VideoAdsController? = ImaVideoAdsController(
    context = context,
    config = config,
    adsId = adsId,
    generation = generation,
    adViewProvider = adViewProvider,
    host = host
  )
}
