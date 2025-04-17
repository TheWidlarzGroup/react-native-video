package com.margelo.nitro.video

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.source.MediaSource
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.video.core.LibraryError
import com.video.core.player.buildMediaSource
import com.video.core.utils.VideoInformationUtils

@DoNotStrip
class HybridVideoPlayerSource(): HybridVideoPlayerSourceSpec() {
  override lateinit var uri: String

  private lateinit var mediaItem: MediaItem
  lateinit var mediaSource: MediaSource

  constructor(uri: String) : this() {
    this.uri = uri
    this.mediaItem = MediaItem.fromUri(uri)

    NitroModules.applicationContext?.let {
      this.mediaSource = buildMediaSource(it, this, mediaItem)
    } ?: run {
      throw LibraryError.ApplicationContextNotFound
    }
  }

  override fun getAssetInformationAsync(): Promise<VideoInformation> {
    return Promise.async {
      return@async VideoInformationUtils.fromUri(uri)
    }
  }

  override val memorySize: Long
    get() = 0
}
