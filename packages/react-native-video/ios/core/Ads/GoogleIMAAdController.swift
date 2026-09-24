//
//  GoogleIMAAdController.swift
//  ReactNativeVideo
//
//  Google IMA client-side ad insertion, driving `AdPlaybackGate`.
//
//  Compiled only when the host app opted into the IMA pod:
//  `$RNVideoUseGoogleIMA = true` in its Podfile (see ReactNativeVideo.podspec),
//  which defines RNV_GOOGLE_IMA for this pod target.
//
//  ## Rendering mode: IMA's own ad player, not the content AVPlayer
//
//  IMA offers two client-side rendering modes. We use the *default* one -
//  `IMAAdDisplayContainer` plus `IMAAVPlayerContentPlayhead`, with **no**
//  `IMAAVPlayerVideoDisplay` - so IMA renders ads with its own internal player
//  inside the ad container view and the content `AVPlayer` never receives an ad
//  item. Reasons, in order of weight:
//
//  1. `VideoPlayerObserver` keys everything off the content player: it KVOs
//     `AVPlayer.currentItem` (-> `onLoad`, `onLoadStart`), observes
//     `AVPlayerItemDidPlayToEndTime` (-> `onEnd`) and runs a periodic time
//     observer (-> `onProgress`). Letting IMA swap ad items in and out of that
//     same player would emit content events for ads, and an `onEnd` at the end
//     of every pre-roll. Keeping ads off the content player keeps every one of
//     those observers honest with no ad-state special-casing.
//  2. The pre-roll case has `player.currentItem == nil` by construction - the
//     gate is withholding it. IMA never touches our player here, so there is
//     no question of whether displacing/replacing a nil item is supported.
//  3. Mid-roll breaks need no item displacement and no seek-back: the content
//     item stays attached and merely paused underneath the ad container.
//
//  The gate/attach logic in `HybridVideoPlayer.commitPlayerItem` is identical
//  either way, so switching to the shared-player mode later is a change to this
//  file only.
//
//  ## Picture in Picture
//
//  Rendering goes through `AVKit.AVPlayerViewController` and PiP is entirely
//  AVKit-internal (there is no app-owned `AVPictureInPictureController` to hand
//  to `IMAPictureInPictureProxy`). We therefore suppress PiP for the duration
//  of an ad break rather than building the full proxy integration - see
//  `applyAdBreakChrome`.
//
//  Main thread only: IMA delivers its callbacks on the main thread, and every
//  entry point from the player/view layer is already main-thread.
//

#if RNV_GOOGLE_IMA

  import AVFoundation
  import AVKit
  import Foundation
  import GoogleInteractiveMediaAds
  import UIKit

  final class GoogleIMAAdController: NSObject, VideoAdControlling {

    // MARK: - Collaborators

    private weak var delegate: VideoAdControllerDelegate?
    private let gate = AdPlaybackGate()

    /// Built on first ad request, not on init: `IMAAdsLoader` spins up a
    /// WKWebView-backed JS bridge and takes 1-2s to become ready, which a
    /// player that never shows an ad should not pay for. Its `IMASettings` are
    /// snapshotted at construction, so it is also the only point where
    /// `language`/`ppid` can be applied.
    private var adsLoader: IMAAdsLoader?
    private let adContainerView: AdContainerView
    private let adDisplayContainer: IMAAdDisplayContainer
    private let contentPlayhead: IMAAVPlayerContentPlayhead

    private weak var playerViewController: AVPlayerViewController?
    private var adsManager: IMAAdsManager?

    // MARK: - Per-source session state

    private var config: VideoAdsConfig?

    /// Bumped on every source swap / teardown. Carried through
    /// `IMAAdsRequest.userContext` as a value type (never `self`) and checked in
    /// every IMA callback, so a late response for video A cannot touch the
    /// session for video B.
    private var generation = UUID()

    private var didIssueRequest = false
    private var requestIsPending = false
    private var didStartManager = false
    private var didResolve = false
    private var didPlayAnyAd = false
    private var activationStartedAt: Date?
    private var watchdog: DispatchWorkItem?
    private var resolutionCompletions: [() -> Void] = []

    /// The ad reported by the most recent `LOADED` event. `LOADED` arrives
    /// *before* `adsManagerDidRequestContentPause`, so it is the only place the
    /// pod info for the break about to start is available.
    private var pendingAd: IMAAd?
    private var currentAd: IMAAd?
    private var currentBreak: (position: AdBreakPosition, totalAds: Int)?

    /// Whether the ad on screen is paused. Set both from `pauseAd()`/`resumeAd()`
    /// and from IMA's own `PAUSE`/`RESUME` events, so it is correct whether the
    /// pause came from the app or from the SDK's own UI.
    private var adIsPaused = false

    private var savedChrome: (controls: Bool, pip: Bool, autoPip: Bool)?

    private var emitter: HybridVideoPlayerEventEmitter? {
      delegate?.adControllerEventEmitter
    }

    // MARK: - Init

    /// Must be called on the main thread - IMA builds UIKit/WebKit objects here.
    init(delegate: VideoAdControllerDelegate) {
      self.delegate = delegate

      let container = AdContainerView(frame: .zero)
      container.backgroundColor = .clear
      container.isUserInteractionEnabled = false
      self.adContainerView = container

      self.adDisplayContainer = IMAAdDisplayContainer(
        adContainer: container,
        viewController: nil
      )
      self.contentPlayhead = IMAAVPlayerContentPlayhead(
        avPlayer: delegate.adControllerContentPlayer
      )

      super.init()

      container.onReadinessChange = { [weak self] in
        guard let self, self.requestIsPending else { return }
        self.issueAdRequestIfPossible()
      }

      gate.onStateChange = { [weak self] previous, current in
        guard let self else { return }
        // Several gate states project onto the same JS-visible VideoAdState
        // (requesting/evaluating both read as `requesting`), so only report
        // transitions JS can actually observe.
        if previous.videoAdState != current.videoAdState {
          self.delegate?.adController(self, didChangeState: current.videoAdState)
        }
        if !previous.allowsContentAttachment && current.allowsContentAttachment {
          self.delegate?.adControllerDidOpenGate(self)
        }
      }
    }

    // MARK: - VideoAdControlling

    var allowsContentAttachment: Bool { gate.allowsContentAttachment }
    var isPlayingAd: Bool { gate.isPlayingAd }
    var isAdPaused: Bool { adIsPaused }
    var adState: VideoAdState { gate.state.videoAdState }
    var isArmed: Bool { gate.state == .armed }

    func configure(with config: VideoAdsConfig?) {
      endSession()

      guard let config, config.adTagUrl != nil else {
        self.config = nil
        gate.apply(.disabledByConfig)
        return
      }

      self.config = config
      let autoActivate = config.autoActivate ?? false
      gate.apply(.configured(autoActivate: autoActivate))

      if autoActivate {
        beginActivation()
      }
    }

    func activate(completion: @escaping () -> Void) {
      // No ads for this source: resolve immediately, never gate.
      guard config != nil else {
        completion()
        return
      }

      // This session's decision already landed.
      if didResolve {
        completion()
        return
      }

      resolutionCompletions.append(completion)

      // No session in flight: either a freshly configured source, or one whose
      // previous session `deactivate()` abandoned. Both start a new one - which
      // is what lets a feed cell run a pre-roll every time it becomes active,
      // not just the first time.
      let needsStart = activationStartedAt == nil
      gate.apply(.activationRequested)
      if needsStart {
        beginActivation()
      }
    }

    /// Tears down the *current ad session*, leaving the source's `ads` config
    /// intact so that a later `activate()` runs a fresh one.
    ///
    /// This is deliberately not "turn ads off for this player". A paged video
    /// feed mounts every preloading neighbour inactive and calls
    /// `deactivateAds()` on it, so clearing the config here would leave every
    /// cell but the very first one permanently unable to request an ad. Only a
    /// source that carries no `ads` config disables the gate, and that is
    /// handled in `configure(with:)`.
    ///
    /// Mirrors Android's `HybridVideoPlayer.deactivateAds()`, which no-ops when
    /// nothing was ever activated and otherwise returns the player to its
    /// inert, un-prepared state with `adsActivated = false`.
    func deactivate() {
      // Nothing was ever activated for this source: there is no session to tear
      // down, and an armed gate must stay armed so the next activation can
      // still run its pre-roll.
      guard activationStartedAt != nil || adsManager != nil else { return }

      // Was content still being withheld pending an ad decision?
      let wasGated = !didResolve

      endSession()

      if config == nil {
        // Shouldn't happen (configure() sets both together), but never leave
        // the gate closed with nothing able to open it.
        gate.apply(.disabledByConfig)
      } else if wasGated {
        // Nothing was ever shown for this source, so go back to exactly the
        // state `configure()` leaves a non-auto-activating source in. Content
        // stays withheld, which is what keeps "no content frame before the ad
        // decision" true for the next activation.
        gate.apply(.configured(autoActivate: false))
      } else {
        // The decision had already landed and content was allowed to play.
        // Abandoning the ad session must not yank it back off screen, so open
        // the gate (a no-op unless we were mid-break) and let `activate()`
        // start a fresh session if this source is activated again.
        gate.apply(.adBreakEnded)
      }

      // Anything awaiting the abandoned activation resolves now - the promise
      // never fails.
      flushResolutionCompletions()
    }

    func contentDidComplete() {
      // IMA schedules post-rolls off this signal, not off the content playhead.
      adsLoader?.contentComplete()
    }

    func skipAd() {
      // Note: IMAAdsManager.skip() only takes effect when IMA is *not*
      // rendering its own skip button (i.e. AdsRenderingSettings.disableUi).
      // With the default UI the user taps IMA's button and the SDK reports
      // kIMAAdEvent_SKIPPED, which still surfaces as onAdSkipped.
      adsManager?.skip()
    }

    func pauseAd() {
      guard gate.isPlayingAd else { return }
      adsManager?.pause()
      // IMA does not report a `PAUSE` event for a programmatic `pause()` (only
      // for its own UI), so the flag is set here as well as in the event
      // handler. Both paths funnel through `setAdPaused` so neither can emit
      // twice.
      setAdPaused(true)
    }

    func resumeAd() {
      guard gate.isPlayingAd else { return }
      adsManager?.resume()
      setAdPaused(false)
    }

    private func setAdPaused(_ paused: Bool) {
      guard adIsPaused != paused else { return }
      adIsPaused = paused
      delegate?.adControllerDidChangeAdPlaybackState(self)
    }

    func attach(to playerViewController: AVPlayerViewController) {
      self.playerViewController = playerViewController
      reassertAdContainer()

      // The ad container must be in a window before IMA will accept a request,
      // so a request made before the view existed is retried here.
      if requestIsPending {
        issueAdRequestIfPossible()
      }
    }

    func reassertAdContainer() {
      guard let playerViewController,
        let overlay = playerViewController.contentOverlayView
      else { return }

      if adContainerView.superview !== overlay {
        adContainerView.removeFromSuperview()
        adContainerView.frame = overlay.bounds
        adContainerView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlay.addSubview(adContainerView)
      } else {
        overlay.bringSubviewToFront(adContainerView)
      }

      adDisplayContainer.adContainerViewController = playerViewController

      if requestIsPending {
        issueAdRequestIfPossible()
      }
    }

    func destroy() {
      endSession()
      flushResolutionCompletions()
      adsLoader?.delegate = nil
      adsLoader = nil
      gate.onStateChange = nil
      applyAdBreakChrome(active: false)
      adContainerView.removeFromSuperview()
      playerViewController = nil
      delegate = nil
    }

    // MARK: - Request lifecycle

    /// Tears down the in-flight ad session without touching the gate's
    /// configuration. Bumps the generation token so any callback still in
    /// flight for the old session is discarded.
    private func endSession() {
      cancelWatchdog()
      adsManager?.delegate = nil
      adsManager?.destroy()
      adsManager = nil
      generation = UUID()
      didIssueRequest = false
      requestIsPending = false
      didStartManager = false
      didResolve = false
      didPlayAnyAd = false
      activationStartedAt = nil
      pendingAd = nil
      currentAd = nil
      currentBreak = nil
      adIsPaused = false
      applyAdBreakChrome(active: false)
    }

    private func beginActivation() {
      activationStartedAt = Date()
      // Second line of defence only - the gate is opened by IMA's own
      // callbacks (or their absence past this deadline), never by a timer used
      // as the primary mechanism.
      startWatchdog()
      issueAdRequestIfPossible()
    }

    private func makeAdsLoaderIfNeeded(for config: VideoAdsConfig) -> IMAAdsLoader {
      if let adsLoader { return adsLoader }

      let settings = IMASettings()
      settings.enableBackgroundPlayback = false
      // The player manages MPNowPlayingInfoCenter itself
      // (see NowPlayingInfoCenterManager); let it keep ownership.
      settings.disableNowPlayingInfo = true
      settings.playerType = "react-native-video"
      if let language = config.language, !language.isEmpty {
        settings.language = language
      }
      if let ppid = config.ppid, !ppid.isEmpty {
        settings.ppid = ppid
      }

      let loader = IMAAdsLoader(settings: settings)
      loader.delegate = self
      adsLoader = loader
      return loader
    }

    private func issueAdRequestIfPossible() {
      guard !didIssueRequest, let config else { return }

      // IMA rejects requests whose ad container is not in the view hierarchy
      // or has no size. The container re-drives this via `onReadinessChange`.
      guard adContainerView.isReadyForAdRequest, playerViewController != nil else {
        requestIsPending = true
        return
      }

      requestIsPending = false
      didIssueRequest = true

      let adsLoader = makeAdsLoaderIfNeeded(for: config)

      // A value type, never `self` - see `generation`.
      let userContext = generation.uuidString as NSString

      let request: IMAAdsRequest
      if let adTagUrl = config.adTagUrl, !adTagUrl.isEmpty {
        request = IMAAdsRequest(
          adTagUrl: adTagUrl,
          adDisplayContainer: adDisplayContainer,
          contentPlayhead: contentPlayhead,
          userContext: userContext
        )
      } else {
        // Nothing to request - fail open immediately.
        resolveIfNeeded(hasAds: false)
        gate.apply(.failed)
        return
      }

      if let vastLoadTimeoutMs = config.vastLoadTimeoutMs, vastLoadTimeoutMs > 0 {
        // IMA takes this one in milliseconds.
        request.vastLoadTimeout = Float(vastLoadTimeoutMs)
      }
      request.adWillAutoPlay = true
      request.adWillPlayMuted = delegate?.adControllerContentPlayer.isMuted ?? false

      adsLoader.requestAds(with: request)
    }

    private func startWatchdog() {
      cancelWatchdog()

      let timeoutMs = config?.adRequestTimeoutMs ?? 8000
      guard timeoutMs > 0 else { return }

      let expectedGeneration = generation
      let work = DispatchWorkItem { [weak self] in
        guard let self, self.generation == expectedGeneration else { return }
        guard self.gate.state.isAwaitingDecision else { return }

        self.emitter?.onAdError(
          AdErrorEvent(
            code: -1,
            message: "No ad decision within \(Int(timeoutMs))ms; playing content.",
            fatal: true
          )
        )
        // Resolve first: endSession() clears the activation timestamp that
        // onAdsResolved's elapsedMs is measured from.
        self.resolveIfNeeded(hasAds: false)
        // Discard the session so a late ad response cannot interrupt content
        // that is already playing.
        self.endSession()
        self.gate.apply(.failed)
      }
      watchdog = work
      DispatchQueue.main.asyncAfter(deadline: .now() + timeoutMs / 1000, execute: work)
    }

    private func cancelWatchdog() {
      watchdog?.cancel()
      watchdog = nil
    }

    private func startManagerIfNeeded() {
      guard !didStartManager, let adsManager else { return }
      didStartManager = true
      adsManager.start()
    }

    // MARK: - Resolution

    /// Emits `onAdsResolved` exactly once per activation and releases anything
    /// awaiting `activateAds()`.
    private func resolveIfNeeded(hasAds: Bool) {
      guard !didResolve else { return }
      didResolve = true
      cancelWatchdog()

      let elapsedMs = activationStartedAt.map { Date().timeIntervalSince($0) * 1000 } ?? 0
      emitter?.onAdsResolved(AdsResolvedEvent(hasAds: hasAds, elapsedMs: elapsedMs))
      flushResolutionCompletions()
    }

    private func flushResolutionCompletions() {
      let completions = resolutionCompletions
      resolutionCompletions = []
      completions.forEach { $0() }
    }

    private func isCurrent(_ userContext: Any?) -> Bool {
      guard let token = userContext as? String else { return false }
      return token == generation.uuidString
    }

    // MARK: - Ad break chrome

    /// AVKit's transport bar would fight IMA's own UI, and PiP during an ad is
    /// not something we support (there is no app-owned
    /// `AVPictureInPictureController` to give `IMAPictureInPictureProxy`), so
    /// both are suppressed for the duration of a break and restored after.
    private func applyAdBreakChrome(active: Bool) {
      adContainerView.isUserInteractionEnabled = active

      guard let playerViewController else {
        if !active { savedChrome = nil }
        return
      }

      if active {
        guard savedChrome == nil else { return }
        savedChrome = (
          controls: playerViewController.showsPlaybackControls,
          pip: playerViewController.allowsPictureInPicturePlayback,
          autoPip: playerViewController.canStartPictureInPictureAutomaticallyFromInline
        )
        playerViewController.showsPlaybackControls = false
        playerViewController.allowsPictureInPicturePlayback = false
        playerViewController.canStartPictureInPictureAutomaticallyFromInline = false
      } else {
        guard let saved = savedChrome else { return }
        savedChrome = nil
        playerViewController.showsPlaybackControls = saved.controls
        playerViewController.allowsPictureInPicturePlayback = saved.pip
        playerViewController.canStartPictureInPictureAutomaticallyFromInline = saved.autoPip
      }
    }

    // MARK: - IMA -> Nitro mapping

    private func adInfo(from ad: IMAAd) -> AdInfo {
      AdInfo(
        adId: ad.adId,
        title: ad.adTitle.isEmpty ? nil : ad.adTitle,
        duration: ad.duration,
        skippable: ad.isSkippable,
        skipTimeOffset: ad.isSkippable ? ad.skipTimeOffset : -1,
        // Paired with `totalAdsInPod`, so this is the 1-based position of the
        // ad inside its pod, which is IMA's `adPosition`.
        adPodIndex: Double(ad.adPodInfo.adPosition),
        totalAdsInPod: Double(ad.adPodInfo.totalAds),
        advertiserName: ad.advertiserName.isEmpty ? nil : ad.advertiserName
      )
    }

    private func breakPosition(for ad: IMAAd?) -> AdBreakPosition {
      guard let podInfo = ad?.adPodInfo else { return .preRoll }
      if podInfo.podIndex < 0 || podInfo.timeOffset < 0 { return .postRoll }
      if podInfo.podIndex == 0 || podInfo.timeOffset == 0 { return .preRoll }
      return .midRoll
    }

    private func emitError(_ error: IMAAdError, fatal: Bool) {
      emitter?.onAdError(
        AdErrorEvent(
          code: Double(error.code.rawValue),
          message: error.message ?? "",
          fatal: fatal
        )
      )
    }
  }

  // MARK: - IMAAdsLoaderDelegate

  extension GoogleIMAAdController: IMAAdsLoaderDelegate {

    func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
      guard isCurrent(adsLoadedData.userContext) else {
        // Stale response for a source we have since replaced.
        adsLoadedData.adsManager?.destroy()
        return
      }

      guard let manager = adsLoadedData.adsManager else {
        resolveIfNeeded(hasAds: false)
        gate.apply(.resolvedWithoutAd)
        return
      }

      adsManager = manager
      manager.delegate = self
      gate.apply(.adsManagerLoaded)

      let renderingSettings = IMAAdsRenderingSettings()
      if let mediaLoadTimeoutMs = config?.mediaLoadTimeoutMs, mediaLoadTimeoutMs > 0 {
        // IMA takes this one in seconds.
        renderingSettings.loadVideoTimeout = mediaLoadTimeoutMs / 1000
      }
      renderingSettings.linkOpenerPresentingController = playerViewController
      manager.initialize(with: renderingSettings)

      // Decide whether this response can even produce a pre-roll. For a plain
      // VAST response `adCuePoints` is empty and the single ad is a pre-roll;
      // for VMAP it lists the scheduled break offsets (0 = pre-roll,
      // negative = post-roll).
      let cuePoints = manager.adCuePoints.compactMap { ($0 as? NSNumber)?.doubleValue }
      let expectsPreRoll = cuePoints.isEmpty || cuePoints.contains { abs($0) < 0.001 }

      if !expectsPreRoll {
        // Nothing will play before content. Open the gate now and let IMA keep
        // watching the content playhead for the mid/post-rolls it does have -
        // which requires `start()`, since no `LOADED` will arrive to trigger it.
        startManagerIfNeeded()
        resolveIfNeeded(hasAds: false)
        gate.apply(.resolvedWithoutAd)
      }
    }

    func adsLoader(_ loader: IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
      guard isCurrent(adErrorData.userContext) else { return }

      emitError(adErrorData.adError, fatal: true)
      resolveIfNeeded(hasAds: false)
      gate.apply(.failed)
    }
  }

  // MARK: - IMAAdsManagerDelegate

  extension GoogleIMAAdController: IMAAdsManagerDelegate {

    func adsManager(_ adsManager: IMAAdsManager, didReceive event: IMAAdEvent) {
      guard adsManager === self.adsManager else { return }

      switch event.type {
      case .LOADED:
        pendingAd = event.ad
        startManagerIfNeeded()

      case .STARTED:
        currentAd = event.ad
        if let ad = event.ad {
          emitter?.onAdStart(adInfo(from: ad))
        }
        // Deliberately not `setAdPaused(false)`: a pause issued before the
        // creative started must survive a late `STARTED`. `endSession()` is
        // what clears the flag between sessions.

      case .PAUSE:
        // The content player's rate cannot express this - the ad runs in IMA's
        // own player - so tell the player to re-emit its playback state.
        setAdPaused(true)

      case .RESUME:
        setAdPaused(false)

      case .COMPLETE:
        if let ad = event.ad ?? currentAd {
          emitter?.onAdComplete(adInfo(from: ad))
        }
        currentAd = nil

      case .SKIPPED:
        if let ad = event.ad ?? currentAd {
          emitter?.onAdSkipped(adInfo(from: ad))
        }
        currentAd = nil

      case .CLICKED:
        emitter?.onAdClicked()

      case .ALL_ADS_COMPLETED:
        emitter?.onAllAdsCompleted()
        resolveIfNeeded(hasAds: didPlayAnyAd)
        gate.apply(.resolvedWithoutAd)

      case .AD_BREAK_FETCH_ERROR:
        // This break will not play. Non-fatal: later breaks (and content) are
        // unaffected, but if this was the pre-roll the gate must open now.
        emitter?.onAdError(
          AdErrorEvent(
            code: Double(IMAErrorCode.VAST_EMPTY_RESPONSE.rawValue),
            message: "Ad break returned no ads.",
            fatal: !didResolve
          )
        )
        startManagerIfNeeded()
        resolveIfNeeded(hasAds: false)
        gate.apply(.resolvedWithoutAd)

      default:
        break
      }
    }

    func adsManager(_ adsManager: IMAAdsManager, didReceive error: IMAAdError) {
      guard adsManager === self.adsManager else { return }

      emitError(error, fatal: true)
      applyAdBreakChrome(active: false)
      resolveIfNeeded(hasAds: didPlayAnyAd)
      // IMA normally follows an ad error with a content-resume request, but do
      // not depend on it: fail open here as well. `.failed` leaves an already
      // open gate open (see AdPlaybackGate.transition).
      gate.apply(.failed)
    }

    func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager) {
      guard adsManager === self.adsManager else { return }

      let position = breakPosition(for: pendingAd)
      let totalAds = pendingAd?.adPodInfo.totalAds ?? 1
      currentBreak = (position, totalAds)
      didPlayAnyAd = true

      // Stop content *before* the gate changes, so nothing can slip a frame in.
      delegate?.adControllerWillPresentAdBreak(self)
      applyAdBreakChrome(active: true)

      // The decision is known the moment an ad break actually starts.
      resolveIfNeeded(hasAds: true)
      gate.apply(.adBreakStarted(position))
      emitter?.onAdBreakStart(
        AdBreakEvent(kind: position.adBreakKind, totalAds: Double(totalAds))
      )
    }

    func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager) {
      guard adsManager === self.adsManager else { return }

      applyAdBreakChrome(active: false)

      if let currentBreak {
        emitter?.onAdBreakEnd(
          AdBreakEvent(
            kind: currentBreak.position.adBreakKind,
            totalAds: Double(currentBreak.totalAds)
          )
        )
      }
      currentBreak = nil
      pendingAd = nil

      resolveIfNeeded(hasAds: didPlayAnyAd)
      gate.apply(.adBreakEnded)
    }

    func adsManager(
      _ adsManager: IMAAdsManager,
      adDidProgressToTime mediaTime: TimeInterval,
      totalTime: TimeInterval
    ) {
      guard adsManager === self.adsManager else { return }

      let podInfo = (currentAd ?? pendingAd)?.adPodInfo
      emitter?.onAdProgress(
        AdProgressInfo(
          currentTime: mediaTime,
          duration: totalTime,
          adPodIndex: Double(podInfo?.adPosition ?? 0),
          totalAdsInPod: Double(podInfo?.totalAds ?? 0)
        )
      )
    }
  }

#endif
