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
import com.margelo.nitro.core.Promise
import com.video.core.LibraryError
import com.video.core.PlayerError
import com.video.core.SourceError
import com.video.core.utils.Threading.runOnMainThread
import com.video.core.utils.Threading.runOnMainThreadSync

@UnstableApi
@DoNotStrip
class HybridVideoPlayer() : HybridVideoPlayerSpec() {
  override lateinit var source: HybridVideoPlayerSourceSpec
  private var allocator: DefaultAllocator? = null

  private var player: Player? = null

  var playerPointer: Player
    get() {
      if (player == null) {
        runOnMainThreadSync {
          initializePlayer()

          if (player == null) {
            throw PlayerError.NotInitialized
          }

          if (player!!.playbackState == Player.STATE_IDLE) {
            player!!.prepare()
          }
        }
      }

      return player!!
    }
    private set(value) {
      player = value
    }

  // Player Properties
  override var currentTime: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.currentPosition.toDouble() / 1000.0 }
    set(value) = runOnMainThread { playerPointer.seekTo((value * 1000).toLong()) }

  override var volume: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.volume.toDouble() }
    set(value) = runOnMainThread { playerPointer.volume = value.toFloat() }

  override val duration: Double
    get() {
      val duration = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.duration }
      return if (duration == C.TIME_UNSET) Double.NaN else duration.toDouble() / 1000.0
    }

  private fun initializePlayer() {
    if (NitroModules.applicationContext == null) {
      throw LibraryError.ApplicationContextNotFound
    }

    val hybridSource = source as? HybridVideoPlayerSource ?: throw PlayerError.InvalidSource

    // Initialize the allocator
    allocator = DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE)

    // Create a LoadControl with the allocator
    val loadControl = DefaultLoadControl.Builder()
      .setAllocator(allocator!!)
      .build()

    // Build the player with the LoadControl
    playerPointer = ExoPlayer.Builder(NitroModules.applicationContext!!)
      .setLoadControl(loadControl)
      .setLooper(Looper.getMainLooper())
      .build()

    playerPointer.setMediaItem(hybridSource.mediaItem)
  }

  constructor(source: HybridVideoPlayerSource) : this() {
    this.source = source
  }

  override fun play() {
    runOnMainThread {
      playerPointer.play()
    }
  }

  override fun pause() {
    runOnMainThread {
      playerPointer.pause()
    }
  }

  override fun replaceSourceAsync(source: HybridVideoPlayerSourceSpec): Promise<Unit> {
    return Promise.async {
      val hybridSource = source as? HybridVideoPlayerSource ?: throw PlayerError.InvalidSource

      runOnMainThreadSync {
        // Update source
        this.source = source
        playerPointer.setMediaItem(hybridSource.mediaItem)

        // Prepare player
        playerPointer.prepare()
      }
    }
  }

  override fun preload(): Promise<Unit> {
    return Promise.async {
      runOnMainThreadSync {
        if (playerPointer.playbackState != Player.STATE_IDLE) {
          return@runOnMainThreadSync
        }

        if (player == null) {
          initializePlayer()
        }

        player?.prepare()
      }
    }
  }

  private fun release() {
    runOnMainThread {
      playerPointer.release()
    }
  }

  override fun clean() {
    release()
  }

  override val memorySize: Long
    get() = if (allocator == null) 0 else allocator!!.totalBytesAllocated.toLong()
}
