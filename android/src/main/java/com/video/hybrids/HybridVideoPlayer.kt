package com.margelo.nitro.video

import android.os.Looper
import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.upstream.DefaultAllocator
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.video.utils.Threading.Companion.runOnMainThreadSync
import com.video.utils.Threading.Companion.runOnMainThread

@UnstableApi
@DoNotStrip
class HybridVideoPlayer() : HybridVideoPlayerSpec() {
  lateinit var player: Player
  private lateinit var allocator: DefaultAllocator
  override lateinit var source: HybridVideoPlayerSourceSpec

  // Player Properties
  override var currentTime: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync player.currentPosition.toDouble() }
    set(value) = runOnMainThread { player.seekTo(value.toLong()) }

  override var volume: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync player.volume.toDouble() }
    set(value) = runOnMainThread { player.volume = value.toFloat() }

  private fun initializePlayerFromSource(source: HybridVideoPlayerSource) {
    this.source = source

    if (NitroModules.applicationContext == null) {
      throw Exception("HybridVideoPlayer: Application Context is null!")
    }

    // Initialize the allocator
    allocator = DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE)

    // Create a LoadControl with the allocator
    val loadControl = DefaultLoadControl.Builder()
      .setAllocator(allocator)
      .build()

    // Build the player with the LoadControl
    player = ExoPlayer.Builder(NitroModules.applicationContext!!)
      .setLoadControl(loadControl)
      .setLooper(Looper.getMainLooper())
      .build()

    player.setMediaItem(source.mediaItem)

    // TODO: Move this to single method to allow more control
    player.prepare()
  }

  constructor(source: HybridVideoPlayerSource) : this() {
    runOnMainThreadSync {
      initializePlayerFromSource(source)
    }
  }

  override fun play() {
    runOnMainThread {
      player.play()
    }
  }

  override fun pause() {
    runOnMainThread {
      player.pause()
    }
  }

  // Updated memorySize property
  override val memorySize: Long
    get() = allocator.totalBytesAllocated.toLong()
}
