package com.margelo.nitro.video

import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.media3.common.C
import androidx.media3.common.Metadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.text.CueGroup
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.analytics.AnalyticsListener
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.upstream.DefaultAllocator
import androidx.media3.extractor.metadata.emsg.EventMessage
import androidx.media3.extractor.metadata.id3.Id3Frame
import androidx.media3.extractor.metadata.id3.TextInformationFrame
import androidx.media3.ui.PlayerView
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.video.core.LibraryError
import com.video.core.PlayerError
import com.video.core.VideoManager
import com.video.core.activities.FullscreenVideoViewActivity
import com.video.core.player.OnAudioFocusChangedListener
import com.video.core.recivers.AudioBecomingNoisyReceiver
import com.video.core.utils.Threading.runOnMainThread
import com.video.core.utils.Threading.runOnMainThreadSync
import com.video.core.utils.VideoOrientationUtils
import com.video.view.VideoView
import java.lang.ref.WeakReference
import kotlin.math.max

@UnstableApi
@DoNotStrip
class HybridVideoPlayer() : HybridVideoPlayerSpec() {
  override lateinit var source: HybridVideoPlayerSourceSpec
  override var eventEmitter = HybridVideoPlayerEventEmitter()
    set(value) {
      if (field != value) {
        audioFocusChangedListener.setEventEmitter(value)
        audioBecomingNoisyReceiver.setEventEmitter(value)
      }
      field = value
    }

  private var allocator: DefaultAllocator? = null

  private var player: ExoPlayer? = null
  private var currentPlayerView: WeakReference<PlayerView>? = null

  // Time updates
  private val progressHandler = Handler(Looper.getMainLooper())
  private var progressRunnable: Runnable? = null

  // Listeners
  private val audioFocusChangedListener = OnAudioFocusChangedListener()
  private val audioBecomingNoisyReceiver = AudioBecomingNoisyReceiver()

  private companion object {
    const val PROGRESS_UPDATE_INTERVAL_MS = 250L
    private const val TAG = "HybridVideoPlayer"
    private const val MIN_BUFFER_DURATION_MS = 5000
    private const val MAX_BUFFER_DURATION_MS = 10000
    private const val BUFFER_FOR_PLAYBACK_DURATION_MS = 1000
    private const val BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_DURATION_MS = 2000
  }

  override var status: VideoPlayerStatus = VideoPlayerStatus.IDLE
    set(value) {
      if (field != value) {
        eventEmitter.onStatusChange(value)
      }
      field = value
    }

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
    val appContext = NitroModules.applicationContext!!

    // Initialize the allocator
    allocator = DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE)

    // Create a LoadControl with the allocator
    val loadControl = DefaultLoadControl.Builder()
      .setAllocator(allocator!!)
      //TODO: Add buffer config to source
      .setBufferDurationsMs(
        MIN_BUFFER_DURATION_MS,  // minBufferMs
        MAX_BUFFER_DURATION_MS, // maxBufferMs
        BUFFER_FOR_PLAYBACK_DURATION_MS,  // bufferForPlaybackMs
        BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_DURATION_MS   // bufferForPlaybackAfterRebufferMs
      )
      .build()

    val renderersFactory = DefaultRenderersFactory(appContext)
      .forceEnableMediaCodecAsynchronousQueueing()
      .setEnableDecoderFallback(true)

    // Build the player with the LoadControl
    playerPointer = ExoPlayer.Builder(NitroModules.applicationContext!!)
      .setLoadControl(loadControl)
      .setLooper(Looper.getMainLooper())
      .setRenderersFactory(renderersFactory)
      .build()

    playerPointer.addListener(playerListener)
    playerPointer.addAnalyticsListener(analyticsListener)
    playerPointer.setMediaSource(hybridSource.mediaSource)

    // Emit onLoadStart
    val sourceType = if (hybridSource.uri.startsWith("http")) SourceType.NETWORK else SourceType.LOCAL
    eventEmitter.onLoadStart(onLoadStartData(sourceType = sourceType, source = hybridSource))
    status = VideoPlayerStatus.LOADING
    startProgressUpdates()
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

  override fun replaceSourceAsync(source: HybridVideoPlayerSourceSpec?): Promise<Unit> {
    return Promise.async {
      if (source == null) {
        playerPointer.stop()
        return@async
      }

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
      if (status == VideoPlayerStatus.IDLE) {
        return@async
      }

      runOnMainThreadSync {
        if (player == null) {
          initializePlayer()
        }

        if (player != null && player?.playbackState != Player.STATE_IDLE) {
          return@runOnMainThreadSync
        }

        player?.prepare()
      }
    }
  }

  private fun release() {
    VideoManager.unregisterPlayer(this)
    stopProgressUpdates()
    runOnMainThread {
      player?.removeListener(playerListener)
      player?.removeAnalyticsListener(analyticsListener)
      player?.release() // Release player
      player = null // Nullify the player

      // Clean Listeners
      audioFocusChangedListener.removeEventEmitter()
      audioBecomingNoisyReceiver.removeEventEmitter()

      // Update status
      status = VideoPlayerStatus.IDLE
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
    get() = allocator?.totalBytesAllocated?.toLong() ?: 0L

  private fun startProgressUpdates() {
    stopProgressUpdates() // Ensure no multiple runnables
    progressRunnable = object : Runnable {
      override fun run() {
        if (playerPointer.playbackState != Player.STATE_IDLE && playerPointer.playbackState != Player.STATE_ENDED) {
          val currentTimeSeconds = playerPointer.currentPosition / 1000.0
          val bufferedDurationSeconds = playerPointer.bufferedPosition / 1000.0
          // bufferDuration is the time from current time that is buffered.
          val playableDurationFromNow = max(0.0, bufferedDurationSeconds - currentTimeSeconds)

          eventEmitter.onProgress(
            onProgressData(
              currentTime = currentTimeSeconds,
              bufferDuration = playableDurationFromNow
            )
          )
          progressHandler.postDelayed(this, PROGRESS_UPDATE_INTERVAL_MS)
        }
      }
    }
    progressHandler.post(progressRunnable ?: return)
  }

  private fun stopProgressUpdates() {
    progressRunnable?.let { progressHandler.removeCallbacks(it) }
    progressRunnable = null
  }

  private val analyticsListener = object: AnalyticsListener {
    override fun onBandwidthEstimate(
      eventTime: AnalyticsListener.EventTime,
      totalLoadTimeMs: Int,
      totalBytesLoaded: Long,
      bitrateEstimate: Long
    ) {
      val videoFormat = playerPointer.videoFormat
      eventEmitter.onBandwidthUpdate(
        BandwidthData(
          bitrate = bitrateEstimate.toDouble(),
          width = if (videoFormat != null) videoFormat.width.toDouble() else null,
          height = if (videoFormat != null) videoFormat.height.toDouble() else null
        )
      )
    }
  }

  private val playerListener = object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
      val isPlayingUpdate = playerPointer.isPlaying
      val isBufferingUpdate = playbackState == Player.STATE_BUFFERING

      eventEmitter.onPlaybackStateChange(
        onPlaybackStateChangeData(
          isPlaying = isPlayingUpdate,
          isBuffering = isBufferingUpdate
        )
      )

      when (playbackState) {
        Player.STATE_IDLE -> {
          status = VideoPlayerStatus.IDLE
          eventEmitter.onBuffer(false)
        }
        Player.STATE_BUFFERING -> {
          status = VideoPlayerStatus.LOADING
          eventEmitter.onBuffer(true)
        }
        Player.STATE_READY -> {
          status = VideoPlayerStatus.READYTOPLAY
          eventEmitter.onBuffer(false)

          val generalVideoFormat = playerPointer.videoFormat
          val currentTracks = playerPointer.currentTracks

          val selectedVideoTrackGroup = currentTracks.groups.find { group -> group.type == C.TRACK_TYPE_VIDEO && group.isSelected }
          val selectedVideoTrackFormat = if (selectedVideoTrackGroup != null && selectedVideoTrackGroup.length > 0) {
            selectedVideoTrackGroup.getTrackFormat(0)
          } else {
            null
          }

          val width = selectedVideoTrackFormat?.width ?: generalVideoFormat?.width ?: 0
          val height = selectedVideoTrackFormat?.height ?: generalVideoFormat?.height ?: 0
          val rotationDegrees = selectedVideoTrackFormat?.rotationDegrees ?: generalVideoFormat?.rotationDegrees

          eventEmitter.onLoad(
            onLoadData(
              currentTime = playerPointer.currentPosition / 1000.0,
              duration = if (playerPointer.duration == C.TIME_UNSET) Double.NaN else playerPointer.duration / 1000.0,
              width = width.toDouble(),
              height = height.toDouble(),
              orientation = VideoOrientationUtils.fromWHR(width, height, rotationDegrees)
            )
          )
          // If player becomes ready and is set to play, start progress updates
          if (playerPointer.playWhenReady) {
            startProgressUpdates()
          }

          eventEmitter.onReadyToDisplay()
        }
        Player.STATE_ENDED -> {
          status = VideoPlayerStatus.IDLE // Or a specific 'COMPLETED' status if you add one
          eventEmitter.onEnd()
          eventEmitter.onBuffer(false)
          stopProgressUpdates()
        }
      }
    }

    override fun onIsPlayingChanged(isPlaying: Boolean) {
      eventEmitter.onPlaybackStateChange(
        onPlaybackStateChangeData(
          isPlaying = isPlaying,
          isBuffering = playerPointer.playbackState == Player.STATE_BUFFERING
        )
      )
      if (isPlaying) {
        startProgressUpdates()
      } else {
        if (playerPointer.playbackState == Player.STATE_ENDED || playerPointer.playbackState == Player.STATE_IDLE) {
            stopProgressUpdates()
        }
      }
    }

    override fun onPlayerError(error: PlaybackException) {
      status = VideoPlayerStatus.ERROR
      stopProgressUpdates()
    }

    override fun onPositionDiscontinuity(
      oldPosition: Player.PositionInfo,
      newPosition: Player.PositionInfo,
      reason: Int
    ) {
      if (reason == Player.DISCONTINUITY_REASON_SEEK || reason == Player.DISCONTINUITY_REASON_SEEK_ADJUSTMENT) {
        eventEmitter.onSeek(newPosition.positionMs / 1000.0)
      }
      // Update progress immediately after a discontinuity if needed by your logic
       val currentTimeSeconds = newPosition.positionMs / 1000.0
       val bufferedDurationSeconds = playerPointer.bufferedPosition / 1000.0
       eventEmitter.onProgress(
         onProgressData(
           currentTime = currentTimeSeconds,
           bufferDuration = max(0.0, bufferedDurationSeconds - currentTimeSeconds)
         )
       )
    }

    override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
      eventEmitter.onPlaybackRateChange(playbackParameters.speed.toDouble())
    }

    override fun onVolumeChanged(volume: Float) {
      // We get here device volume changes, and if
      // player is not muted we will sync it
      if (!muted) {
        this@HybridVideoPlayer.volume = volume.toDouble()
      }

      eventEmitter.onVolumeChange(volume.toDouble())
    }

    override fun onCues(cueGroup: CueGroup) {
      val texts = cueGroup.cues.mapNotNull { it.text?.toString() }
      if (texts.isNotEmpty()) {
        eventEmitter.onTextTrackDataChanged(texts.toTypedArray())
      }
    }

    override fun onMetadata(metadata: Metadata) {
      val timedMetadataObjects = mutableListOf<TimedMetadataObject>()
      for (i in 0 until metadata.length()) {
        val entry = metadata.get(i)

        when (entry) {
          is Id3Frame -> {
            var value = ""

            if (entry is TextInformationFrame) {
              value = entry.values.first()
            }

            timedMetadataObjects.add(TimedMetadataObject(entry.id, value))
          }
          is EventMessage ->
            timedMetadataObjects.add(TimedMetadataObject(entry.schemeIdUri, entry.value))
          else -> Log.d(TAG, "Unknown metadata: $entry")
        }
      }
      if (timedMetadataObjects.isNotEmpty()) {
        eventEmitter.onTimedMetadata(TimedMetadata(metadata = timedMetadataObjects.toTypedArray()))
      }
    }

    override fun onTracksChanged(tracks: Tracks) {
      super.onTracksChanged(tracks)
    }
  }
}
