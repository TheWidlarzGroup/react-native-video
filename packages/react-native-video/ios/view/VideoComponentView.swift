//
//  VideoComponent.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 30/09/2024.
//

import AVFoundation
import AVKit
import Foundation
import UIKit

// A plain UIViewController that hosts an AVPlayerViewController as a child
// for fullscreen modal presentation. We then layer AVKit's own fullscreen
// presentation on top of this host (via enterFullscreen(animated:) on the
// embedded controller) to get back AVKit's native dismissal chrome — swipe
// down and close button.
//
// The host exists because direct modal presentation of AVPlayerViewController
// causes AVKit to dismiss the modal at PiP-start, orphaning the controller.
// With a stable host underneath, AVKit's fullscreen layer can come and go
// (during PiP cycles) without dismantling our presentation.
final class FullscreenHostViewController: UIViewController {
  override var prefersStatusBarHidden: Bool { return true }
  override var prefersHomeIndicatorAutoHidden: Bool { return true }
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask { return .all }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
  }
}

@objc public class VideoComponentView: UIView {
  public weak var player: HybridVideoPlayerSpec? = nil {
    didSet {
      guard let player = player as? HybridVideoPlayer else { return }
      configureAVPlayerViewController(with: player.player)
    }
  }

  var delegate: VideoViewDelegate?
  private var playerView: UIView? = nil

  // True between enterFullscreen() succeeding and exitFullscreen()/dismissal
  // completing. We track this ourselves rather than asking AVKit because
  // AVKit's lifecycle callbacks (notably willEndFullScreenPresentation) fire
  // for multiple distinct situations that look identical from the delegate's
  // perspective; we need our own state to disambiguate.
  var isPresentingFullscreen: Bool = false

  // True between willStartPictureInPicture and didStopPictureInPicture.
  // Same rationale as isPresentingFullscreen: we need this to tell apart
  // willEndFullScreenPresentation firing because PiP is starting (skip) vs
  // because the user dismissed via AVKit chrome (handle).
  var isPictureInPictureActive: Bool = false

  // The fullscreen host VC we present modally. Strong-referenced while
  // presented; nil otherwise.
  private var fullscreenHostVC: FullscreenHostViewController?

  // The parent VC the AVPlayerViewController was a child of before fullscreen.
  // Used to reattach inline on dismiss.
  private weak var preFullscreenParentVC: UIViewController?

  private var observer: VideoComponentViewObserver? {
    didSet {
      playerViewController?.delegate = observer
      observer?.updatePlayerViewControllerObservers()
    }
  }

  private var _keepScreenAwake: Bool = false
  var keepScreenAwake: Bool {
    get {
      guard let player = player as? HybridVideoPlayer else { return false }
      return player.player.preventsDisplaySleepDuringVideoPlayback
    }
    set {
      guard let player = player as? HybridVideoPlayer else { return }
      player.player.preventsDisplaySleepDuringVideoPlayback = newValue
      _keepScreenAwake = newValue
    }
  }

  var playerViewController: AVPlayerViewController? {
    didSet {
      guard let observer, let playerViewController else { return }
      playerViewController.delegate = observer
      observer.updatePlayerViewControllerObservers()
    }
  }

  public var controls: Bool = false {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }
        playerViewController.showsPlaybackControls = self.controls
      }
    }
  }

  public var allowsPictureInPicturePlayback: Bool = false {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }

        VideoManager.shared.requestAudioSessionUpdate()
        playerViewController.allowsPictureInPicturePlayback = self.allowsPictureInPicturePlayback
      }
    }
  }

  public var autoEnterPictureInPicture: Bool = false {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }

        VideoManager.shared.requestAudioSessionUpdate()
        playerViewController.canStartPictureInPictureAutomaticallyFromInline =
          self.autoEnterPictureInPicture
      }
    }
  }

  public var resizeMode: ResizeMode = .none {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }
        playerViewController.videoGravity = resizeMode.toVideoGravity()
      }
    }
  }

  @objc public var nitroId: NSNumber = -1 {
    didSet {
      VideoComponentView.globalViewsMap.setObject(self, forKey: nitroId)
    }
  }

  @objc public static var globalViewsMap: NSMapTable<NSNumber, VideoComponentView> =
    .strongToWeakObjects()

  @objc public override init(frame: CGRect) {
    super.init(frame: frame)
    VideoManager.shared.register(view: self)
    setupPlayerView()
    observer = VideoComponentViewObserver(view: self)
  }

  deinit {
    VideoManager.shared.unregister(view: self)
  }

  @objc public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupPlayerView()
  }

  func setNitroId(nitroId: NSNumber) {
    self.nitroId = nitroId
  }

  private func setupPlayerView() {
    // Create a UIView to hold the video player layer
    playerView = UIView(frame: self.bounds)
    playerView?.translatesAutoresizingMaskIntoConstraints = false
    if let playerView = playerView {
      addSubview(playerView)
      NSLayoutConstraint.activate([
        playerView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
        playerView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
        playerView.topAnchor.constraint(equalTo: self.topAnchor),
        playerView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
      ])
    }
  }

  public func configureAVPlayerViewController(with player: AVPlayer) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, let playerView = self.playerView else { return }

      // Skip reconfiguration if player hasn't changed and controller already exists
      if let existingController = self.playerViewController,
        existingController.player === player
      {
        return
      }

      // Remove previous controller if any
      self.playerViewController?.willMove(toParent: nil)
      self.playerViewController?.view.removeFromSuperview()
      self.playerViewController?.removeFromParent()

      let controller = AVPlayerViewController()
      controller.player = player
      controller.showsPlaybackControls = controls
      controller.videoGravity = self.resizeMode.toVideoGravity()
      controller.view.frame = playerView.bounds
      controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      controller.view.backgroundColor = .clear

      // We manage this manually in NowPlayingInfoCenterManager
      controller.updatesNowPlayingInfoCenter = false

      if #available(iOS 16.0, *) {
        if let initialSpeed = controller.speeds.first(where: { $0.rate == player.rate }) {
          controller.selectSpeed(initialSpeed)
        }
      }
      // Disable video frame analysis to prevent visual lookup
      if #available(iOS 16.0, iPadOS 16.0, macCatalyst 18.0, *) {
        controller.allowsVideoFrameAnalysis = false
      }

      // Find nearest UIViewController
      if let parentVC = self.findViewController() {
        parentVC.addChild(controller)
        playerView.addSubview(controller.view)
        controller.didMove(toParent: parentVC)
        self.playerViewController = controller
      }
    }
  }

  // Helper to find nearest UIViewController
  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      if let vc = r as? UIViewController {
        return vc
      }
      responder = r.next
    }
    return nil
  }

  // The topmost VC capable of presenting modally right now. Walks
  // presentedViewController so we don't try to present from a VC that
  // already has something on top of it.
  private func topMostPresentingViewController() -> UIViewController? {
    let keyWindow = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first(where: { $0.isKeyWindow })

    var top = keyWindow?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }

  public override func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)

    if newSuperview == nil {
      PluginsRegistry.shared.notifyVideoViewDestroyed(view: self)
      
      // We want to disable this when view is about to unmount
      if keepScreenAwake {
        keepScreenAwake = false
      }
    } else {
      PluginsRegistry.shared.notifyVideoViewCreated(view: self)
      
      // We want to restore keepScreenAwake after component remount
      if _keepScreenAwake {
        keepScreenAwake = true
      }
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    if !isPresentingFullscreen {
      // Update the frame of the playerViewController's view when the view's layout changes
      playerViewController?.view.frame = playerView?.bounds ?? .zero
      playerViewController?.contentOverlayView?.frame = playerView?.bounds ?? .zero
      for subview in playerViewController?.contentOverlayView?.subviews ?? [] {
        subview.frame = playerView?.bounds ?? .zero
      }
    }
  }

  public func enterFullscreen() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard !self.isPresentingFullscreen else { return }
      guard let presenter = self.topMostPresentingViewController() else {
#if DEBUG
        NSLog("[PiPDebug] enterFullscreen — no presenter found, aborting")
#endif
        return
      }

#if DEBUG
      NSLog("[PiPDebug] enterFullscreen — presenting host from \(presenter)")
#endif

      self.preFullscreenParentVC = playerViewController.parent

      // Detach the AVPlayerViewController from its inline child-VC hierarchy.
      playerViewController.willMove(toParent: nil)
      playerViewController.view.removeFromSuperview()
      playerViewController.removeFromParent()

      // Build the host VC and embed the AVPlayerViewController as its child.
      let host = FullscreenHostViewController()
      host.modalPresentationStyle = .fullScreen
      host.modalPresentationCapturesStatusBarAppearance = true

      // Force view load so host.view exists before we attach the child.
      host.loadViewIfNeeded()

      host.addChild(playerViewController)
      playerViewController.view.frame = host.view.bounds
      playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      host.view.addSubview(playerViewController.view)
      playerViewController.didMove(toParent: host)

      self.fullscreenHostVC = host
      self.isPresentingFullscreen = true

      // We do not fire willEnterFullscreen / onFullscreenChange(true) here.
      // The chained enterFullscreen(animated:) below triggers AVKit's
      // willBeginFullScreenPresentation, which fires those events via the
      // observer. This is intentional architectural symmetry: both entry and
      // exit are driven solely by AVKit's fullscreen lifecycle delegates
      // (willBeginFullScreenPresentation / willEndFullScreenPresentation),
      // so JS sees a single fire of each event regardless of whether the
      // transition was initiated by our public API, AVKit chrome, or PiP.

      presenter.present(host, animated: true) { [weak self] in
        guard let self = self else { return }

        // Engage AVKit's own fullscreen on top of our host to restore native
        // dismissal chrome (swipe-down, close button). The host stays put as
        // the stable parent VC, so PiP-start has nowhere to dismantle.
        // Brief delay lets the modal presentation transition settle before AVKit
        // kicks off its own fullscreen transition; without it, AVKit can refuse
        // to enter or end up in an inconsistent state.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
          self?.playerViewController?.enterFullscreen(animated: true)
        }
      }
    }
  }

  public func exitFullscreen() throws {
    guard isPresentingFullscreen else { return }
    guard playerViewController != nil else { return }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Trigger AVKit's own fullscreen-exit. This causes AVKit to fire
      // willEndFullScreenPresentationWithAnimationCoordinator on our
      // observer, which then runs the same poll-based host dismiss path
      // that the close-button and swipe-down gestures use. Routing both
      // user-driven and JS-driven exits through the same path avoids
      // duplicate dismiss attempts and the timing problems of trying to
      // dismiss the host out from under AVKit's still-active fullscreen.
      self.playerViewController?.exitFullscreen(animated: true)
    }
  }

  // Called from the observer when AVKit's own fullscreen chrome signals
  // dismissal (swipe-down, close button).
  //
  // Critical detail discovered through tracing: the React Native side may
  // deallocate this VideoComponentView during AVKit's fullscreen-collapse
  // animation. Any [weak self] captures across that animation may go nil,
  // silently dropping the dismiss. Worse: when self is alive, calling
  // host.dismiss() directly inside the AVKit-coordinator completion is
  // silently rejected by UIKit (the completion never fires) because
  // AVKit's collapse animation is still in flight.
  //
  // The workable strategy: strong-capture the host so we can dismiss it
  // regardless of self's lifecycle, and dispatch the dismiss to a delayed
  // tick so AVKit's collapse animation has time to finish. self-dependent
  // teardown (reattaching inline, etc) is conditional on self being alive.
  func dismissFullscreenFromAVKitSignal() {
#if DEBUG
    NSLog("[PiPDebug] dismissFromAVKit ENTRY — isPresentingFullscreen=\(isPresentingFullscreen)")
#endif
    guard isPresentingFullscreen else { return }
    guard let host = fullscreenHostVC else { return }

    // Pause the player so audio stops. Do this synchronously here — even
    // if self deallocates, the player is owned elsewhere and the pause
    // call will have already taken effect.
    playerViewController?.player?.pause()

    isPresentingFullscreen = false

    let strongHost = host
    let startTime = Date()

    // Diagnostic helper: when AVKit's private fullscreen has fully torn
    // down, host.presentedViewController will be nil. We use this as the
    // signal that the host can be safely dismissed.
    func isAVKitFullscreenGone() -> Bool {
      return strongHost.presentedViewController == nil
    }

    func performDismiss(_ source: String) {
#if DEBUG
      let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)
      NSLog("[PiPDebug] dismissFromAVKit — performDismiss [\(source)] at +\(elapsed)ms host.presentedVC=\(String(describing: strongHost.presentedViewController)) host.presentingVC=\(String(describing: strongHost.presentingViewController))")
#endif

      guard strongHost.presentingViewController != nil else {
#if DEBUG
        NSLog("[PiPDebug] dismissFromAVKit — host already dismissed, skipping")
#endif
        return
      }

      strongHost.dismiss(animated: true) { [weak self] in
#if DEBUG
        let stillPresenting = strongHost.presentingViewController != nil
        NSLog("[PiPDebug] dismissFromAVKit — dismiss completion [\(source)], stillPresenting=\(stillPresenting)")
#endif
        self?.tearDownFullscreenHost()
        self?.delegate?.onFullscreenChange(false)
      }
    }

    // Strategy: if AVKit's fullscreen is already gone, dismiss immediately.
    // Otherwise poll on the runloop until it goes — this is event-driven in
    // spirit (we react the moment AVKit finishes) and bounded by a hard cap.
    if isAVKitFullscreenGone() {
#if DEBUG
      NSLog("[PiPDebug] dismissFromAVKit — AVKit fullscreen already gone at start")
#endif
      performDismiss("immediate")
      return
    }

    var pollCount = 0
    func poll() {
      pollCount += 1
      if isAVKitFullscreenGone() {
        performDismiss("poll(\(pollCount))")
        return
      }
      // 1s hard cap (40 * 25ms) is a generous bound based on observed AVKit
      // collapse durations of ~400-600ms; the cap exists so a stuck AVKit
      // can't hang the dismissal indefinitely. Tightening it risks dismissing
      // before AVKit's private fullscreen has torn down, which UIKit will
      // silently reject.
      if pollCount > 40 {
#if DEBUG
        NSLog("[PiPDebug] dismissFromAVKit — poll cap reached, dismissing anyway")
#endif
        performDismiss("poll(timeout)")
        return
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(25), execute: poll)
    }
    poll()
  }

  // Called when fullscreen has ended for any reason: user-initiated
  // exitFullscreen, AVKit chrome dismissal, or unexpected dismissal.
  // Reattaches the player VC to its inline parent and clears host state.
  func tearDownFullscreenHost() {
    guard let playerViewController = self.playerViewController else { return }

    // Detach from host if still attached there.
    if playerViewController.parent === self.fullscreenHostVC {
      playerViewController.willMove(toParent: nil)
      playerViewController.view.removeFromSuperview()
      playerViewController.removeFromParent()
    }

    self.fullscreenHostVC = nil

    // Reattach inline only if our host UIView is still in a window. If it
    // isn't, the JS side has already navigated away or unmounted the video
    // component, and there's nothing meaningful to reattach to. We deliberately
    // do not try to find a different parent VC — that would attach the player
    // to wherever happens to be on screen, which is almost never what the
    // user wants.
    guard self.window != nil else {
      self.preFullscreenParentVC = nil
      return
    }
    guard let playerView = self.playerView else {
      self.preFullscreenParentVC = nil
      return
    }
    let parentVC = self.preFullscreenParentVC ?? self.findViewController()
    self.preFullscreenParentVC = nil
    guard let parentVC = parentVC else { return }

    parentVC.addChild(playerViewController)
    playerViewController.view.frame = playerView.bounds
    playerViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    playerView.addSubview(playerViewController.view)
    playerViewController.didMove(toParent: parentVC)
  }

  public func startPictureInPicture() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    guard AVPictureInPictureController.isPictureInPictureSupported() else {
      throw VideoViewError.pictureInPictureNotSupported.error()
    }

    DispatchQueue.main.async {
      // Here we skip error handling for simplicity
      // We do check for PiP support earlier in the code
      try? playerViewController.startPictureInPicture()
    }
  }

  public func stopPictureInPicture() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    DispatchQueue.main.async {
      // Here we skip error handling for simplicity
      // We do check for PiP support earlier in the code
      playerViewController.stopPictureInPicture()
    }
  }
}
