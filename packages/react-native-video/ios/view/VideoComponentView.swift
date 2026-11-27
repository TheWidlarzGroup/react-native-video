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
      if self.playerViewController != nil {
        // What was tracked described the old controller (#4774).
        self.observer?.resetFullscreenState()
      }
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
      observer.isFullscreen || observer.isFullscreenTransitioning
    else { return }
    // Nothing queued may run after the view is gone.
    observer.resetFullscreenState(keepingFullscreen: true)
    let player = playerViewController.player
    let wasPlaying = player.map { $0.timeControlStatus != .paused } ?? false
    // AVKit pauses the player when it leaves native fullscreen. After a normal exit the observer
    // resumes it, but this view and its observer are going away, so resume it here once the
    // dismissal is done. In v7 the player outlives the view, and an unmount outside fullscreen
    // does not pause it either.
    playerViewController.exitFullscreen(animated: false) {
      if wasPlaying {
        player?.play()
      }
    }
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
