package com.margelo.nitro.video

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.datasource.RawResourceDataSource
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.proguard.annotations.DoNotStrip
import com.twg.video.react.AppContextHolder

@DoNotStrip
class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec() {
  private val appContext: Context
    get() = AppContextHolder.appContext
      ?: throw IllegalStateException(
        "AppContextHolder.appContext has not been initialized."
      )

  private fun normalizeUri(input: String): String {
    val parsedUri = Uri.parse(input)

    if (parsedUri.scheme != null) {
      return parsedUri.toString()
    }

    val resId = appContext.resources
      .getIdentifier(input, "raw", appContext.packageName)

    if (resId == 0) {
      throw IllegalArgumentException("The video resource '$input' could not be found in res/raw")
    }

    val mediaUri = RawResourceDataSource.buildRawResourceUri(resId)

    return mediaUri.toString()
  }

  override fun fromUri(uri: String): HybridVideoPlayerSourceSpec {
    val config = NativeVideoConfig(
      uri = normalizeUri(uri),
      externalSubtitles = null,
      drm = null,
      headers = null,
      bufferConfig = null,
      metadata = null,
      initializeOnCreation = true
    )

    return HybridVideoPlayerSource(config)
  }

  override fun fromVideoConfig(config: NativeVideoConfig): HybridVideoPlayerSourceSpec {
    return HybridVideoPlayerSource(config)
  }

  override val memorySize: Long
    get() = 0
}
