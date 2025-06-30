package com.margelo.nitro.video

import androidx.media3.common.MediaItem
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class HybridVideoPlayerSource(): HybridVideoPlayerSourceSpec() {
  override lateinit var uri: String
  lateinit var mediaItem: MediaItem

  constructor(uri: String) : this() {
    this.uri = uri
    this.mediaItem = MediaItem.fromUri(uri)
  }

  override val memorySize: Long
    get() = 0
}
