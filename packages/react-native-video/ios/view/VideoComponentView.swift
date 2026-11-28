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

@objc public class VideoComponentView: UIView {
  public weak var player: HybridVideoPlayerSpec? = nil {
    didSet {
      guard let player = player as? HybridVideoPlayer else { return }
      configureAVPlayerViewController(with: player.player)
    }
  }

  var delegate: VideoViewDelegate?
  private var playerView: UIView? = nil

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

  var isPictureInPictureActive = false

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

  public var resizeMode: VideoResizeMode = .none {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }
        playerViewController.videoGravity = resizeMode.toVideoGravity()
      }
    }
  }

  public var fullscreenOrientation: FullscreenOrientation = .all {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        (self.playerViewController as? VideoPlayerViewController)?.fullscreenOrientation = self.fullscreenOrientation
      }
    }
  }

  public var fullscreenAutorotate: Bool = true {
    didSet {
      DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        (self.playerViewController as? VideoPlayerViewController)?.fullscreenAutorotate = self.fullscreenAutorotate
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
    detachPlayerViewController()
  }

  /// The controller is a child of the nearest view controller. Without this, that parent keeps
  /// it, and the `AVPlayer` it holds, for as long as the screen lives: one controller and one
  /// player for every `VideoView` that was ever mounted there.
  private func detachPlayerViewController() {
    guard let controller = playerViewController else { return }

    // Picture in picture and native fullscreen are run by this controller and may outlive the
    // view. Leave it in place for them.
    if isPictureInPictureActive || controller.presentedViewController != nil {
      return
    }

    let detach = {
      controller.willMove(toParent: nil)
      controller.view.removeFromSuperview()
      controller.removeFromParent()
    }

    if Thread.isMainThread {
      detach()
    } else {
      DispatchQueue.main.async(execute: detach)
    }
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
      if self.playerViewController != nil {
        // What was tracked described the old controller (#4774).
        self.observer?.resetFullscreenState()
      }
      self.playerViewController?.willMove(toParent: nil)
      self.playerViewController?.view.removeFromSuperview()
      self.playerViewController?.removeFromParent()

      let controller = VideoPlayerViewController()
      controller.fullscreenOrientation = self.fullscreenOrientation
      controller.fullscreenAutorotate = self.fullscreenAutorotate
      controller.player = player
      controller.showsPlaybackControls = controls
      controller.videoGravity = self.resizeMode.toVideoGravity()
      controller.view.frame = playerView.bounds
      controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      controller.view.backgroundColor = .clear

      // We manage this manually in NowPlayingInfoCenterManager
      controller.updatesNowPlayingInfoCenter = false

      // The PiP props usually arrive before this controller exists (it is created
      // asynchronously), and their didSet has nothing to apply them to then.
      controller.allowsPictureInPicturePlayback = self.allowsPictureInPicturePlayback
      controller.canStartPictureInPictureAutomaticallyFromInline = self.autoEnterPictureInPicture

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

  public override func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)

    if newSuperview == nil {
      PluginsRegistry.shared.notifyVideoViewDestroyed(view: self)

      #if os(iOS)
      exitFullscreenBeforeUnmount()
      #endif

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

    // Update the frame of the playerViewController's view when the view's layout changes
    playerViewController?.view.frame = playerView?.bounds ?? .zero
    playerViewController?.contentOverlayView?.frame = playerView?.bounds ?? .zero
    for subview in playerViewController?.contentOverlayView?.subviews ?? [] {
      subview.frame = playerView?.bounds ?? .zero
    }
  }

  #if os(iOS)
  /// The view is leaving the hierarchy while its player is fullscreen. AVKit keeps its fullscreen
  /// presentation alive on its own, so without this it stays on top of the app (a black screen
  /// once the item is gone) and every later `enterFullscreen()`, from any view, is ignored until
  /// the app restarts.
  private func exitFullscreenBeforeUnmount() {
    guard let playerViewController, let observer,
      observer.isFullscreen || observer.isFullscreenBusy
    else { return }
    let player = playerViewController.player
    let wasPlaying = player.map { $0.timeControlStatus != .paused } ?? false
    // AVKit pauses the player when it leaves native fullscreen. After a normal exit the observer
    // resumes it, but this view and its observer are going away, so resume it here once the
    // dismissal is done. In v7 the player outlives the view, and an unmount outside fullscreen
    // does not pause it either.
    let exitFullscreen = {
      playerViewController.exitFullscreen(animated: false) {
        if wasPlaying {
          player?.play()
        }
      }
    }

    // Nothing queued may run after the view is gone.
    observer.queuedFullscreenTarget = nil

    if observer.isFullscreenBusy {
      // Unmounted while entering (or right after asking to enter). AVKit ignores an exit in the
      // middle of a transition and then finishes presenting fullscreen over an app whose view is
      // gone, which covers the app and blocks every later enterFullscreen(). Exit once the
      // transition is over instead.
      observer.runAfterFullscreenTransition { observer in
        guard observer.isFullscreen || playerViewController.presentedViewController != nil
        else { return }
        exitFullscreen()
        // AVKit does not leave fullscreen for a controller whose inline view is no longer in a
        // window, which is the case now. Dismiss what it presented if it is still up.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
          guard let presented = playerViewController.presentedViewController else { return }
          presented.presentingViewController?.dismiss(animated: false) {
            if wasPlaying {
              player?.play()
            }
          }
        }
      }
      return
    }

    observer.resetFullscreenState(keepingFullscreen: true)
    exitFullscreen()
  }
  #endif

  public func enterFullscreen() throws {
    guard playerViewController != nil else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    DispatchQueue.main.async { [weak self] in
      self?.requestFullscreen(true)
    }
  }

  public func exitFullscreen() throws {
    guard playerViewController != nil else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    DispatchQueue.main.async { [weak self] in
      self?.requestFullscreen(false)
    }
  }

  /// AVKit asserts when a fullscreen transition is requested while another one is running
  /// (#4774). A request made in that window is remembered and applied when the transition
  /// ends, so `enterFullscreen()` followed by `exitFullscreen()` ends inline instead of being
  /// dropped. Only the last request counts. Main thread only.
  private func requestFullscreen(_ target: Bool) {
    guard let playerViewController, let observer else { return }

    if observer.isFullscreenBusy {
      observer.queuedFullscreenTarget = target
      return
    }
    observer.queuedFullscreenTarget = nil
    guard observer.isFullscreen != target else { return }

    observer.fullscreenRequestWillStart()
    if target {
      playerViewController.enterFullscreen(animated: true)
    } else {
      playerViewController.exitFullscreen(animated: true)
    }
  }

  /// Called by the observer when a transition has ended, was cancelled, or never started.
  func applyQueuedFullscreenRequest() {
    guard let observer, !observer.isFullscreenBusy,
      let target = observer.queuedFullscreenTarget
    else { return }
    observer.queuedFullscreenTarget = nil
    requestFullscreen(target)
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
