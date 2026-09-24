package com.margelo.nitro.video

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.annotation.MainThread
import androidx.media3.common.C
import androidx.media3.common.Metadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.Tracks
import androidx.media3.common.text.CueGroup
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.analytics.AnalyticsListener
import androidx.media3.exoplayer.upstream.DefaultAllocator
import androidx.media3.extractor.metadata.emsg.EventMessage
import androidx.media3.extractor.metadata.id3.Id3Frame
import androidx.media3.extractor.metadata.id3.TextInformationFrame
import androidx.media3.ui.PlayerView
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.twg.video.core.LibraryError
import com.twg.video.core.PlayerError
import com.twg.video.core.VideoManager
import com.twg.video.core.ads.SwappableAdViewProvider
import com.twg.video.core.ads.VideoAdsController
import com.twg.video.core.ads.VideoAdsControllerFactory
import com.twg.video.core.ads.VideoAdsHost
import com.twg.video.core.extensions.updateService
import com.twg.video.core.player.OnAudioFocusChangedListener
import com.twg.video.core.recivers.AudioBecomingNoisyReceiver
import com.twg.video.core.services.playback.VideoPlaybackService
import com.twg.video.core.services.playback.VideoPlaybackServiceConnection
import com.twg.video.core.utils.TextTrackUtils
import com.twg.video.core.utils.Threading.mainThreadProperty
import com.twg.video.core.utils.Threading.runOnMainThread
import com.twg.video.core.utils.Threading.runOnMainThreadSync
import com.twg.video.core.utils.VideoOrientationUtils
import com.twg.video.view.VideoView
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.max

@UnstableApi
@DoNotStrip
class HybridVideoPlayer() : HybridVideoPlayerSpec(), AutoCloseable {
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
  private var context = NitroModules.applicationContext
    ?: run {
    throw LibraryError.ApplicationContextNotFound
  }

  var player: ExoPlayer = runOnMainThreadSync {
    // Build Temporary player that will be replaced when source is loaded
    return@runOnMainThreadSync ExoPlayer.Builder(context).build()
  }

  var loadedWithSource = false
  private val releaseStarted = AtomicBoolean(false)
  internal val isReleaseStarted: Boolean
    get() = releaseStarted.get()
  private var currentPlayerView: WeakReference<PlayerView>? = null

  var wasAutoPaused = false

  // Buffer Config
  private var bufferConfig: BufferConfig? = null
    get() = source.config.bufferConfig

  // Time updates
  private val progressHandler = Handler(Looper.getMainLooper())
  private var progressRunnable: Runnable? = null

  // Listeners
  private val audioFocusChangedListener = OnAudioFocusChangedListener()
  private val audioBecomingNoisyReceiver = AudioBecomingNoisyReceiver()

  // Service Connection
  private val videoPlaybackServiceConnection = VideoPlaybackServiceConnection(WeakReference(this), context)

  // Text track selection state
  private var selectedExternalTrackIndex: Int? = null

  private companion object {
    const val PROGRESS_UPDATE_INTERVAL_MS = 250L
    const val DEFAULT_AD_REQUEST_TIMEOUT_MS = 8000L
    const val MIN_AD_REQUEST_TIMEOUT_MS = 1000L
    private const val TAG = "HybridVideoPlayer"
    private const val DEFAULT_MIN_BUFFER_DURATION_MS = 5000
    private const val DEFAULT_MAX_BUFFER_DURATION_MS = 10000
    private const val DEFAULT_BUFFER_FOR_PLAYBACK_DURATION_MS = 1000
    private const val DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_DURATION_MS = 2000
    private const val DEFAULT_BACK_BUFFER_DURATION_MS = 0
  }

  override var status: VideoPlayerStatus = VideoPlayerStatus.IDLE
    set(value) {
      if (field != value) {
        eventEmitter.onStatusChange(value)
      }
      field = value
    }

  override var showNotificationControls: Boolean = false
    get() = runOnMainThreadSync { field }
    set(value) {
      runOnMainThreadSync {
        field = value
        VideoPlaybackService.updateService(videoPlaybackServiceConnection)
      }
    }

  // Player Properties
  override var currentTime: Double by mainThreadProperty(
    get = { player.currentPosition.toDouble() / 1000.0 },
    set = { value -> runOnMainThread { player.seekTo((value * 1000).toLong()) } }
  )

  // volume defined by user
  var userVolume: Double = 1.0

  override var volume: Double by mainThreadProperty(
    get = { player.volume.toDouble() },
    set = { value ->
      userVolume = value
      player.volume = value.toFloat()
    }
  )

  override val duration: Double by mainThreadProperty(
    get = {
      val duration = player.duration
      return@mainThreadProperty if (duration == C.TIME_UNSET) Double.NaN else duration.toDouble() / 1000.0
    }
  )

  override var loop: Boolean by mainThreadProperty(
    get = {
      player.repeatMode == Player.REPEAT_MODE_ONE
    },
    set = { value ->
      player.repeatMode = if (value) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    }
  )

  override var muted: Boolean by mainThreadProperty(
    get = {
      val playerVolume = player.volume.toDouble()
      return@mainThreadProperty playerVolume == 0.0
    },
    set = { value ->
      if (value) {
        userVolume = volume
        player.volume = 0f
      } else {
        player.volume = userVolume.toFloat()
      }
      eventEmitter.onVolumeChange(onVolumeChangeData(
        volume = player.volume.toDouble(),
        muted = muted
      ))
    }
  )

  override var rate: Double by mainThreadProperty(
    get = { player.playbackParameters.speed.toDouble() },
    set = { value ->
      player.playbackParameters = player.playbackParameters.withSpeed(value.toFloat())
    }
  )

  override var mixAudioMode: MixAudioMode = MixAudioMode.AUTO
    set(value) {
      VideoManager.audioFocusManager.requestAudioFocusUpdate()
      field = value
    }

  // iOS only property
  override var ignoreSilentSwitchMode: IgnoreSilentSwitchMode = IgnoreSilentSwitchMode.AUTO

  // iOS only property - no-op on Android
  override var disableAudioSessionManagement: Boolean = false

  override var playInBackground: Boolean = false
    get() = runOnMainThreadSync { field }
    set(value) {
      runOnMainThreadSync {
        field = value
        VideoPlaybackService.updateService(videoPlaybackServiceConnection)
      }
    }

  override var playWhenInactive: Boolean = false

  override var isPlaying: Boolean by mainThreadProperty(
    get = { player.isPlaying == true }
  )

  // MARK: - Ads (Google IMA client-side ad insertion)

  /**
   * Generation token for the current ad session.
   *
   * Bumped whenever the ad session this player owns becomes invalid: a source replacement, a
   * `deactivateAds()`, a fail-open, and at the very start of `release()` (before the deferred
   * teardown runs). It is baked into the `adsId` handed to IMA - reusing an `adsId` makes IMA
   * *restore* the previous session's ad playback state, which is never what we want after a
   * source swap - and every ad callback, error and watchdog checks it via
   * [VideoAdsHost.isCurrentGeneration] before touching any state.
   */
  private val adsGeneration = AtomicInteger(0)

  private var adsController: VideoAdsController? = null
  private var adViewProvider: SwappableAdViewProvider? = null

  /** True once `activateAds()` has taken effect for the current source. */
  private var adsActivated = false

  /** True once the ad decision for the current session is known (or has failed open). */
  private var adsDecisionResolved = false

  private var adsActivationStartedAtMs = 0L
  private var adsWatchdog: Runnable? = null
  private val pendingActivationPromises = mutableListOf<Promise<Unit>>()

  private var adStateBacking: VideoAdState = VideoAdState.IDLE

  /** The ad config of the current source, or `null` when this source has no usable ad tag. */
  private val adsConfig: VideoAdsConfig?
    get() = source.config.ads?.takeIf { !it.adTagUrl.isNullOrEmpty() }

  override val isPlayingAd: Boolean
    get() = runOnMainThreadSync {
      !releaseStarted.get() && loadedWithSource && player.isPlayingAd
    }

  override val adState: VideoAdState
    get() = adStateBacking

  /**
   * Whether an ad is on screen or about to be. Used to gate Picture-in-Picture: entering PiP
   * mid-ad would hide the ad UI (skip/learn-more) with no way to reach it.
   */
  internal val isAdActive: Boolean
    get() = when (adStateBacking) {
      VideoAdState.ACTIVATING, VideoAdState.REQUESTING, VideoAdState.PLAYING -> true
      else -> false
    }

  /**
   * THE gate. While this is true the player must not be prepared, because preparing the plain,
   * unwrapped content source would let a content frame render before IMA has told us whether a
   * pre-roll exists. Once `activateAds()` runs, the source handed to the player is an
   * `AdsMediaSource`, which structurally withholds its `Timeline` until the ad decision lands.
   */
  private val shouldDeferPrepare: Boolean
    get() = adsConfig != null && !adsActivated

  private val adsHost = object : VideoAdsHost {
    override fun isCurrentGeneration(generation: Int): Boolean =
      !releaseStarted.get() && adsGeneration.get() == generation

    override fun onAdStateChanged(state: VideoAdState) = runOnMainThread { setAdState(state) }

    override val adEventEmitter: HybridVideoPlayerEventEmitter
      get() = eventEmitter

    override fun onAdActivityEnded() = runOnMainThread {
      VideoManager.onAdActivityEnded(this@HybridVideoPlayer)
    }
  }

  /**
   * Prepares the player unless the current source's ads still gate it.
   *
   * Every prepare site in this class funnels through here, which is what keeps the 5
   * preloading-but-inactive players in a vertical feed completely inert: no `ImaAdsLoader`, no
   * `AdsMediaSource`, no ad request, no decoded frame.
   */
  @MainThread
  private fun prepareUnlessAdsDeferred() {
    val ads = adsConfig
    if (ads == null || adsActivated) {
      player.prepare()
      return
    }

    if (ads.autoActivate == true) {
      activateAdsInternal(null)
      return
    }

    Log.d(TAG, "prepare() deferred - source has an ads config and activateAds() was not called")
  }

  override fun activateAds(): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMainThread { activateAdsInternal(promise) }
    return promise
  }

  @MainThread
  private fun activateAdsInternal(promise: Promise<Unit>?) {
    if (releaseStarted.get()) {
      promise?.resolve(Unit)
      return
    }

    val ads = adsConfig
    if (ads == null) {
      // Documented as a no-op when there is no ads config.
      promise?.resolve(Unit)
      return
    }

    if (adsActivated) {
      // Idempotent: join the in-flight activation, or resolve straight away if the decision
      // already landed.
      if (adsDecisionResolved) promise?.resolve(Unit)
      else promise?.let { pendingActivationPromises.add(it) }
      return
    }

    adsActivated = true
    adsDecisionResolved = false
    adsActivationStartedAtMs = SystemClock.elapsedRealtime()
    promise?.let { pendingActivationPromises.add(it) }
    setAdState(VideoAdState.ACTIVATING)

    try {
      if (!loadedWithSource) {
        initializePlayer()
      }

      val hybridSource = source as? HybridVideoPlayerSource ?: throw PlayerError.InvalidSource
      val generation = adsGeneration.get()

      val provider = adViewProvider ?: SwappableAdViewProvider(context).also { adViewProvider = it }
      provider.attachTo(currentPlayerView?.get())

      val controller = VideoAdsControllerFactory.create(
        context = context,
        config = ads,
        adsId = "${System.identityHashCode(this)}#$generation",
        generation = generation,
        adViewProvider = provider,
        host = adsHost
      )

      if (controller == null) {
        eventEmitter.onAdError(
          AdErrorEvent(
            code = -2.0,
            message = "Google IMA is not available in this build " +
              "(set RNVideo_useExoplayerIma=true to enable it)",
            fatal = true
          )
        )
        failOpenToContent("IMA not linked into this build")
        return
      }

      adsController = controller
      // Media3's ImaAdsLoader asserts a player is attached before AdsLoader.start() runs, and
      // AdsLoader.start() happens during prepare(). This ordering is mandatory.
      controller.attachPlayer(player)

      player.setMediaSource(hybridSource.createMediaSource(controller.mediaSourceWrapper))
      setAdState(VideoAdState.REQUESTING)
      player.prepare()
      armAdsWatchdog(generation, ads)
    } catch (error: Throwable) {
      Log.e(TAG, "Failed to activate ads", error)
      eventEmitter.onAdError(
        AdErrorEvent(
          code = -3.0,
          message = error.message ?: error.toString(),
          fatal = true
        )
      )
      failOpenToContent("activation threw ${error.javaClass.simpleName}")
    }
  }

  override fun deactivateAds() {
    runOnMainThread {
      if (!adsActivated && adsController == null) {
        return@runOnMainThread
      }

      // Was content still gated behind an unresolved ad decision?
      val wasGated = !adsDecisionResolved

      adsGeneration.incrementAndGet()
      cancelAdsWatchdog()
      VideoManager.cancelPendingPictureInPicture(this)

      val controller = adsController
      adsController = null

      val hybridSource = source as? HybridVideoPlayerSource
      if (hybridSource != null && !releaseStarted.get()) {
        if (wasGated) {
          // Never activated far enough to play content: go back to the inert, un-prepared
          // state. stop() first, because ExoPlayer implicitly re-prepares on setMediaSource
          // when it isn't already idle - which would render a content frame.
          player.stop()
          player.setMediaSource(hybridSource.mediaSource)
        } else {
          // Content was already allowed to play; keep it playing, just without ads.
          player.setMediaSource(hybridSource.mediaSource)
          player.prepare()
        }
      }

      controller?.detachPlayer()
      controller?.release()
      adViewProvider?.detach()
      adViewProvider = null

      adsActivated = false
      adsDecisionResolved = false
      applyAdState(VideoAdState.IDLE)
      resolvePendingActivationPromises()
    }
  }

  override fun skipAd() {
    runOnMainThread { adsController?.skipAd() }
  }

  @MainThread
  private fun setAdState(state: VideoAdState) {
    // Reaching a terminal state without having seen the timeline (e.g. IMA reports the ad
    // break directly) still counts as the ad decision resolving.
    if (!adsDecisionResolved &&
      (state == VideoAdState.PLAYING || state == VideoAdState.CONTENT || state == VideoAdState.FAILED)
    ) {
      resolveAdDecision(hasAds = state == VideoAdState.PLAYING, nextState = state)
      return
    }
    applyAdState(state)
  }

  @MainThread
  private fun applyAdState(state: VideoAdState) {
    if (adStateBacking == state) return
    val wasAdActive = isAdActive
    adStateBacking = state
    eventEmitter.onAdStateChange(state)

    // Keep the activity's auto-enter-PiP flag in sync: it must be off for as long as an ad is
    // (or is about to be) on screen.
    if (wasAdActive != isAdActive) {
      VideoManager.refreshPictureInPictureParams()
    }
  }

  /**
   * Called when the ad decision becomes known - i.e. once it is settled whether an ad will
   * play. Resolves the `activateAds()` promise, which is deliberately *not* tied to ad
   * playback finishing.
   */
  @MainThread
  private fun resolveAdDecision(hasAds: Boolean, nextState: VideoAdState) {
    if (adsDecisionResolved) {
      applyAdState(nextState)
      return
    }

    adsDecisionResolved = true
    cancelAdsWatchdog()

    val elapsedMs = (SystemClock.elapsedRealtime() - adsActivationStartedAtMs).toDouble()
    eventEmitter.onAdsResolved(AdsResolvedEvent(hasAds = hasAds, elapsedMs = elapsedMs))

    applyAdState(nextState)
    resolvePendingActivationPromises()

    if (!isAdActive) {
      VideoManager.onAdActivityEnded(this)
    }
  }

  @MainThread
  private fun resolvePendingActivationPromises() {
    if (pendingActivationPromises.isEmpty()) return
    val promises = pendingActivationPromises.toList()
    pendingActivationPromises.clear()
    promises.forEach { it.resolve(Unit) }
  }

  /**
   * `AdsMediaSource` publishing its first non-empty `Timeline` is the reliable proxy for "IMA
   * has resolved the ad decision" - there is no direct callback for it. Until that happens
   * there is no `Timeline`, so ExoPlayer cannot create a content `MediaPeriod` and no content
   * frame can be rendered.
   */
  @MainThread
  private fun maybeResolveAdDecisionFromTimeline(timeline: Timeline, reason: Int) {
    if (adsDecisionResolved || timeline.isEmpty) return
    if (adStateBacking != VideoAdState.ACTIVATING && adStateBacking != VideoAdState.REQUESTING) return

    // ExoPlayer publishes a masked placeholder timeline synchronously from setMediaSource
    // (reason PLAYLIST_CHANGED, one period, no ad groups). Treating that as the ad decision
    // would open the gate before IMA has said anything at all, so only a real source update
    // with a non-placeholder window counts.
    if (reason != Player.TIMELINE_CHANGE_REASON_SOURCE_UPDATE) return
    if (timeline.getWindow(0, Timeline.Window()).isPlaceholder) return

    val period = Timeline.Period()
    timeline.getPeriod(0, period)

    val adGroupCount = period.adGroupCount
    val hasAds = adGroupCount > 0
    // A pre-roll is an ad group scheduled at position 0. Without one (no ads at all, or a
    // VMAP with only mid/post-rolls) content is free to play right now.
    val hasPreRoll = hasAds && period.getAdGroupTimeUs(0) == 0L

    resolveAdDecision(
      hasAds = hasAds,
      // Stay in REQUESTING while a pre-roll is imminent; IMA's AD_BREAK_STARTED moves us to
      // PLAYING a moment later. Either way the PiP gate stays closed until the ad is done.
      nextState = if (hasPreRoll) VideoAdState.REQUESTING else VideoAdState.CONTENT
    )
  }

  @MainThread
  private fun armAdsWatchdog(generation: Int, ads: VideoAdsConfig) {
    cancelAdsWatchdog()

    val timeoutMs = (ads.adRequestTimeoutMs?.toLong() ?: DEFAULT_AD_REQUEST_TIMEOUT_MS)
      .coerceAtLeast(MIN_AD_REQUEST_TIMEOUT_MS)

    val runnable = Runnable {
      if (!adsHost.isCurrentGeneration(generation) || adsDecisionResolved) return@Runnable

      eventEmitter.onAdError(
        AdErrorEvent(
          code = -1.0,
          message = "No ad decision within ${timeoutMs}ms - failing open to content",
          // `fatal` documents "content will now play" (see AdErrorEvent doc comment and the
          // matching iOS watchdog) - true here, since failOpenToContent() does exactly that.
          fatal = true
        )
      )
      failOpenToContent("watchdog timeout after ${timeoutMs}ms")
    }

    adsWatchdog = runnable
    progressHandler.postDelayed(runnable, timeoutMs)
  }

  @MainThread
  private fun cancelAdsWatchdog() {
    adsWatchdog?.let { progressHandler.removeCallbacks(it) }
    adsWatchdog = null
  }

  /**
   * Safety net only - never the primary gating mechanism. Tears the ad session down and plays
   * the plain content source.
   */
  @MainThread
  private fun failOpenToContent(reason: String) {
    Log.w(TAG, "Ad session failing open ($reason) - continuing with plain content playback")

    adsGeneration.incrementAndGet()
    cancelAdsWatchdog()
    VideoManager.cancelPendingPictureInPicture(this)

    val controller = adsController
    adsController = null

    if (!releaseStarted.get()) {
      val hybridSource = source as? HybridVideoPlayerSource
      if (hybridSource != null) {
        // stop() releases the AdsMediaSource (and the IMA AdTagLoader with it) before the
        // content source takes its place.
        player.stop()
        player.setMediaSource(hybridSource.mediaSource)
        player.prepare()
      }
    }

    controller?.detachPlayer()
    controller?.release()
    adViewProvider?.detach()
    adViewProvider = null

    resolveAdDecision(hasAds = false, nextState = VideoAdState.FAILED)
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
      .setBufferDurationsMs(
        bufferConfig?.minBufferMs?.toInt() ?: DEFAULT_MIN_BUFFER_DURATION_MS, // minBufferMs
        bufferConfig?.maxBufferMs?.toInt() ?: DEFAULT_MAX_BUFFER_DURATION_MS, // maxBufferMs
        bufferConfig?.bufferForPlaybackMs?.toInt()
          ?: DEFAULT_BUFFER_FOR_PLAYBACK_DURATION_MS, // bufferForPlaybackMs
        bufferConfig?.bufferForPlaybackAfterRebufferMs?.toInt()
          ?: DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_DURATION_MS // bufferForPlaybackAfterRebufferMs
      )
      .setBackBuffer(
        bufferConfig?.backBufferDurationMs?.toInt()
          ?: DEFAULT_BACK_BUFFER_DURATION_MS, // backBufferDurationMs,
        false // retainBackBufferFromKeyframe
      )
      .build()

    val renderersFactory = DefaultRenderersFactory(context)
      .forceEnableMediaCodecAsynchronousQueueing()
      .setEnableDecoderFallback(true)

    // Build the player with the LoadControl
    player = ExoPlayer.Builder(context)
      .setLoadControl(loadControl)
      .setLooper(Looper.getMainLooper())
      .setRenderersFactory(renderersFactory)
      .build()

    loadedWithSource = true

    player.addListener(playerListener)
    player.addAnalyticsListener(analyticsListener)
    player.setMediaSource(hybridSource.mediaSource)
    ensureNotReleased()

    // Emit onLoadStart
    val sourceType = if (hybridSource.uri.startsWith("http")) SourceType.NETWORK else SourceType.LOCAL
    eventEmitter.onLoadStart(onLoadStartData(sourceType = sourceType, source = hybridSource))
    ensureNotReleased()
    status = VideoPlayerStatus.LOADING
    ensureNotReleased()
    startProgressUpdates()
  }

  private fun ensureNotReleased() {
    if (releaseStarted.get()) {
      throw PlayerError.Cancelled
    }
  }

  override fun initialize(): Promise<Unit> {
    return Promise.async {
      return@async runOnMainThreadSync {
        ensureNotReleased()
        initializePlayer()
        prepareUnlessAdsDeferred()
        ensureNotReleased()
      }
    }
  }

  constructor(source: HybridVideoPlayerSource) : this() {
    this.source = source

    runOnMainThreadSync {
      try {
        if (source.config.initializeOnCreation == true) {
          initializePlayer()
          prepareUnlessAdsDeferred()
        }
        VideoManager.registerPlayer(this)
      } catch (_: PlayerError.Cancelled) {
        // Initialization was cancelled by release.
      }
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

  override fun seekBy(time: Double) {
    currentTime = (currentTime + time).coerceIn(0.0, duration)
  }

  override fun seekTo(time: Double) {
    currentTime = time.coerceIn(0.0, duration)
  }

  override fun replaceSourceAsync(source: Variant_NullType_HybridVideoPlayerSourceSpec?): Promise<Unit> {
    return Promise.async {
      val source = source?.asSecondOrNull()

      if (source == null) {
        release()
        return@async
      }

      runOnMainThreadSync {
        ensureNotReleased()
        val hybridSource = source as? HybridVideoPlayerSource ?: throw PlayerError.InvalidSource
        val oldSource = this.source as? HybridVideoPlayerSource
        oldSource?.sourceLoader?.cancel()

        // A new source means a new ad session: invalidate the old generation so any in-flight
        // IMA callback/watchdog from the previous source can no longer touch state, and tear
        // the previous ads loader down.
        teardownAdsSessionForSourceChange()

        this.source = source

        if (shouldDeferPrepare) {
          // ExoPlayer implicitly re-prepares on setMediaSource when it isn't idle. Force it
          // idle first so the new, ad-gated source cannot render a content frame.
          player.stop()
        }

        player.setMediaSource(hybridSource.mediaSource)
        ensureNotReleased()

        prepareUnlessAdsDeferred()
        ensureNotReleased()
      }
    }
  }

  /**
   * Invalidates the current ad session without touching the player's media source - the caller
   * is about to replace it anyway.
   */
  @MainThread
  private fun teardownAdsSessionForSourceChange() {
    adsGeneration.incrementAndGet()
    cancelAdsWatchdog()
    VideoManager.cancelPendingPictureInPicture(this)

    val controller = adsController
    adsController = null
    controller?.detachPlayer()
    controller?.release()

    adViewProvider?.detach()
    adViewProvider = null

    adsActivated = false
    adsDecisionResolved = false
    applyAdState(VideoAdState.IDLE)
    resolvePendingActivationPromises()
  }

  override fun preload(): Promise<Unit> {
    return Promise.async {
      runOnMainThreadSync {
        ensureNotReleased()
        if (!loadedWithSource) {
          initializePlayer()
        }

        if (player.playbackState != Player.STATE_IDLE) {
          return@runOnMainThreadSync
        }

        prepareUnlessAdsDeferred()
        ensureNotReleased()
      }
    }
  }

  override fun release() {
    if (!releaseStarted.compareAndSet(false, true)) {
      return
    }

    // Invalidate the ad session immediately, before the deferred teardown below runs, so no
    // IMA callback or watchdog that fires in the meantime can touch a dying player.
    adsGeneration.incrementAndGet()

    // Defer teardown until the current main-thread callback chain has finished.
    progressHandler.post { completeRelease() }
  }

  @MainThread
  private fun completeRelease() {
    VideoPlaybackService.updateService(videoPlaybackServiceConnection)

    try {
      VideoManager.unregisterPlayer(this)
    } finally {
      stopProgressUpdates()
      loadedWithSource = false

      cancelAdsWatchdog()
      VideoManager.cancelPendingPictureInPicture(this)
      resolvePendingActivationPromises()

      val controller = adsController
      adsController = null
      adViewProvider?.detach()
      adViewProvider = null

      eventEmitter.clearAllListeners()

      player.removeListener(playerListener)
      player.removeAnalyticsListener(analyticsListener)

      // Media3's documented teardown order for an ad-enabled player, all on the main thread:
      // ImaAdsLoader.setPlayer(null) -> player.release() -> ImaAdsLoader.release().
      controller?.detachPlayer()
      player.release() // Release player
      controller?.release()

      applyAdState(VideoAdState.IDLE)

      // Clean Listeners
      audioFocusChangedListener.removeEventEmitter()
      audioBecomingNoisyReceiver.removeEventEmitter()

      // Update status
      status = VideoPlayerStatus.IDLE
    }
  }

  fun movePlayerToVideoView(videoView: VideoView) {
    VideoManager.addViewToPlayer(videoView, this)

    runOnMainThreadSync {
      PlayerView.switchTargetView(player, currentPlayerView?.get(), videoView.playerView)
      currentPlayerView = WeakReference(videoView.playerView)

      // IMA captured this provider's ViewGroup once, at AdsLoader.start() time, and cannot be
      // handed a different one. Re-parent that same container into the PlayerView the player
      // just moved to, otherwise the ad UI (skip button, learn-more) stays on the old view.
      adViewProvider?.attachTo(videoView.playerView)
    }
  }

  override fun dispose() {
    release()
  }

  override fun close() {
    release()
  }

  override val memorySize: Long
    // 1 MiB by default
    get() = allocator?.totalBytesAllocated?.toLong() ?: (1024L * 1024L)

  private fun startProgressUpdates() {
    stopProgressUpdates() // Ensure no multiple runnables
    progressRunnable = object : Runnable {
      override fun run() {
        if (player.playbackState != Player.STATE_IDLE && player.playbackState != Player.STATE_ENDED) {
          val currentTimeSeconds = player.currentPosition / 1000.0
          val bufferedDurationSeconds = player.bufferedPosition / 1000.0
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
      val videoFormat = player.videoFormat
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
    override fun onTimelineChanged(timeline: Timeline, reason: Int) {
      super.onTimelineChanged(timeline, reason)
      maybeResolveAdDecisionFromTimeline(timeline, reason)
    }

    override fun onPlaybackStateChanged(playbackState: Int) {
      val isPlayingUpdate = player.isPlaying
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

          val generalVideoFormat = player.videoFormat
          val currentTracks = player.currentTracks

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
              currentTime = player.currentPosition / 1000.0,
              duration = if (player.duration == C.TIME_UNSET) Double.NaN else player.duration / 1000.0,
              width = width.toDouble(),
              height = height.toDouble(),
              orientation = VideoOrientationUtils.fromWHR(width, height, rotationDegrees)
            )
          )
          // If player becomes ready and is set to play, start progress updates
          if (player.playWhenReady) {
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
      super.onIsPlayingChanged(isPlaying)
      eventEmitter.onPlaybackStateChange(
        onPlaybackStateChangeData(
          isPlaying = isPlaying,
          isBuffering = player.playbackState == Player.STATE_BUFFERING
        )
      )
      // Backstop for the (rare) case where the timeline said a pre-roll was scheduled but IMA
      // never reported the break - once real content is actually playing, the ad gate is open.
      if (isPlaying &&
        adsDecisionResolved &&
        adStateBacking == VideoAdState.REQUESTING &&
        !player.isPlayingAd
      ) {
        applyAdState(VideoAdState.CONTENT)
        VideoManager.onAdActivityEnded(this@HybridVideoPlayer)
      }

      if (isPlaying) {
        VideoManager.setLastPlayedPlayer(this@HybridVideoPlayer)
        startProgressUpdates()
      } else {
        if (player.playbackState == Player.STATE_ENDED || player.playbackState == Player.STATE_IDLE) {
          stopProgressUpdates()
        }
      }
      // Keep the activity's auto-enter-PiP flag in sync with the last-played video.
      VideoManager.refreshPictureInPictureParams()
    }

    override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
      super.onPlayWhenReadyChanged(playWhenReady, reason)

      // A resume cancels a pending auto-pause, so the next foreground won't force-resume it.
      if (playWhenReady) {
        this@HybridVideoPlayer.wasAutoPaused = false
      }

      // playWhenReady can change without isPlaying (pause while buffering), so refresh here too.
      VideoManager.refreshPictureInPictureParams()
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
       val bufferedDurationSeconds = player.bufferedPosition / 1000.0
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

      VideoManager.audioFocusManager.requestAudioFocusUpdate()
      eventEmitter.onVolumeChange(onVolumeChangeData(
        volume = volume.toDouble(),
        muted = muted
      ))
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

  // MARK: - Text Track Management

  override fun getAvailableTextTracks(): Array<TextTrack> {
    return TextTrackUtils.getAvailableTextTracks(player, source)
  }

  override fun selectTextTrack(textTrack: Variant_NullType_TextTrack?) {
    selectedExternalTrackIndex = TextTrackUtils.selectTextTrack(
      player = player,
      textTrack = textTrack?.asSecondOrNull(),
      source = source,
      onTrackChange = { track -> eventEmitter.onTrackChange(track) }
    )
  }

  override val selectedTrack: TextTrack?
    get() = TextTrackUtils.getSelectedTrack(player, source)
}
