package com.margelo.nitro.video

import android.os.Looper
import android.view.SurfaceView
import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.upstream.DefaultAllocator
import androidx.media3.ui.PlayerView
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.video.core.LibraryError
import com.video.core.PlayerError
import com.video.core.VideoManager
import com.video.core.activities.FullscreenVideoViewActivity
import com.video.core.utils.Threading.runOnMainThread
import com.video.core.utils.Threading.runOnMainThreadSync
import com.video.view.VideoView
import java.lang.ref.WeakReference
import kotlin.math.max
import kotlin.math.min

@UnstableApi
@DoNotStrip
class HybridVideoPlayer() : HybridVideoPlayerSpec() {
  override lateinit var source: HybridVideoPlayerSourceSpec
  private var allocator: DefaultAllocator? = null

  private var player: ExoPlayer? = null
  private var currentPlayerView: WeakReference<PlayerView>? = null

  var playerPointer: ExoPlayer
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

  // volume defined by user
  var userVolume: Double = 1.0

  override var volume: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.volume.toDouble() }
    set(value) = runOnMainThread {
      userVolume = value
      playerPointer.volume = value.toFloat()
    }

  override val duration: Double
    get() {
      val duration = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.duration }
      return if (duration == C.TIME_UNSET) Double.NaN else duration.toDouble() / 1000.0
    }

  override var loop: Boolean
    get() {
      val repeatMode = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.repeatMode }
      return repeatMode == Player.REPEAT_MODE_ONE
    }
    set(value) = runOnMainThread {
      playerPointer.repeatMode = if (value) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    }

  override var muted: Boolean
    get() = runOnMainThreadSync {
      val playerVolume = playerPointer.volume.toDouble()
      val isMuted = playerVolume == 0.0
      return@runOnMainThreadSync isMuted
    }
    set(value) = runOnMainThread {
      if (value) {
        userVolume = volume
        playerPointer.volume = 0f
      } else {
        playerPointer.volume = userVolume.toFloat()
      }
    }

  override var rate: Double
    get() = runOnMainThreadSync { return@runOnMainThreadSync playerPointer.playbackParameters.speed.toDouble() }
    set(value) = runOnMainThread {
      playerPointer.playbackParameters = playerPointer.playbackParameters.withSpeed(value.toFloat())
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
      //TODO: Add buffer config to source
      .setBufferDurationsMs(
        5000,  // minBufferMs
        10000, // maxBufferMs
        1000,  // bufferForPlaybackMs
        2000   // bufferForPlaybackAfterRebufferMs
      )
      .build()

    // Build the player with the LoadControl
    playerPointer = ExoPlayer.Builder(NitroModules.applicationContext!!)
      .setLoadControl(loadControl)
      .setLooper(Looper.getMainLooper())
      .build()

    playerPointer.setMediaSource(hybridSource.mediaSource)
  }

  constructor(source: HybridVideoPlayerSource) : this() {
    this.source = source
    VideoManager.registerPlayer(this)
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

  override fun seekBy(time: Double) {
    currentTime = (currentTime + time).coerceIn(0.0, duration)
  }

  override fun seekTo(time: Double) {
    currentTime = time.coerceIn(0.0, duration)
  }

  override fun replaceSourceAsync(source: HybridVideoPlayerSourceSpec): Promise<Unit> {
    return Promise.async {
      val hybridSource = source as? HybridVideoPlayerSource ?: throw PlayerError.InvalidSource

      runOnMainThreadSync {
        // Update source
        this.source = source
        playerPointer.setMediaSource(hybridSource.mediaSource)

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
    VideoManager.unregisterPlayer(this)
    runOnMainThread {
      playerPointer.release()
    }
  }

  override fun clean() {
    release()
  }

  fun movePlayerToVideoView(videoView: VideoView) {
    VideoManager.addViewToPlayer(videoView, this)

    runOnMainThreadSync {
      PlayerView.switchTargetView(playerPointer, currentPlayerView?.get(), videoView.playerView)
      currentPlayerView = WeakReference(videoView.playerView)
    }
  }

  fun moveToFullscreenActivity(activity: FullscreenVideoViewActivity) {
    VideoManager.registerFullscreenActivity(activity, activity.hashCode())

    runOnMainThreadSync {
      PlayerView.switchTargetView(playerPointer, currentPlayerView?.get(), activity.playerView)
      currentPlayerView = WeakReference(activity.playerView)
    }
  }

  override val memorySize: Long
    get() = (if (allocator == null) 0 else allocator!!.totalBytesAllocated).toLong()
}
