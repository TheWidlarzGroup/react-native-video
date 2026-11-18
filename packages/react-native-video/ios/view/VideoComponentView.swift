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

  #if os(tvOS)
  private weak var fullscreenParent: UIViewController?
  private weak var fullscreenFocusView: UIView?
  private var fullscreenTransitionInProgress = false
  #endif

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
      #if !os(tvOS)
      DispatchQueue.main.async { [weak self] in
        guard let self = self, let playerViewController = self.playerViewController else { return }

        VideoManager.shared.requestAudioSessionUpdate()
        playerViewController.canStartPictureInPictureAutomaticallyFromInline =
          self.autoEnterPictureInPicture
      }
      #endif
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
      #if !os(tvOS)
      controller.updatesNowPlayingInfoCenter = false
      #endif

      if #available(iOS 16.0, tvOS 16.0, *) {
        if let initialSpeed = controller.speeds.first(where: { $0.rate == player.rate }) {
          controller.selectSpeed(initialSpeed)
        }
      }
       // Disable video frame analysis to prevent visual lookup
      #if !os(tvOS)
      if #available(iOS 16.0, iPadOS 16.0, macCatalyst 18.0, *) {
        controller.allowsVideoFrameAnalysis = false
      }
      #endif

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

    #if os(tvOS)
    // AVKit owns the presented controller's layout until it returns inline.
    guard fullscreenParent == nil else { return }
    #endif

    // Update the frame of the playerViewController's view when the view's layout changes
    playerViewController?.view.frame = playerView?.bounds ?? .zero
    playerViewController?.contentOverlayView?.frame = playerView?.bounds ?? .zero
    for subview in playerViewController?.contentOverlayView?.subviews ?? [] {
      subview.frame = playerView?.bounds ?? .zero
    }
  }

  public func enterFullscreen() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    #if os(tvOS)
    DispatchQueue.main.async { [weak self] in
      guard let self, self.fullscreenParent == nil,
        !self.fullscreenTransitionInProgress,
        let parent = playerViewController.parent,
        parent.presentedViewController == nil else { return }

      self.fullscreenParent = parent
      self.fullscreenFocusView = UIFocusSystem.focusSystem(for: self)?.focusedItem as? UIView
      self.fullscreenTransitionInProgress = true
      self.delegate?.willEnterFullscreen()

      playerViewController.willMove(toParent: nil)
      playerViewController.view.removeFromSuperview()
      playerViewController.removeFromParent()
      parent.present(playerViewController, animated: true) { [weak self] in
        guard let self else { return }
        self.fullscreenTransitionInProgress = false
        self.delegate?.onFullscreenChange(true)
      }
    }
    #else
    DispatchQueue.main.async {
      playerViewController.enterFullscreen(animated: true)
    }
    #endif
  }

  public func exitFullscreen() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    #if os(tvOS)
    DispatchQueue.main.async { [weak self] in
      guard let self, self.fullscreenParent != nil,
        !self.fullscreenTransitionInProgress else { return }
      self.willDismissFullscreen()
      playerViewController.dismiss(animated: true) { [weak self] in
        self?.didDismissFullscreen()
      }
    }
    #else
    DispatchQueue.main.async {
      playerViewController.exitFullscreen(animated: true)
    }
    #endif
  }

  #if os(tvOS)
  func willDismissFullscreen() {
    guard fullscreenParent != nil, !fullscreenTransitionInProgress else { return }
    fullscreenTransitionInProgress = true
    delegate?.willExitFullscreen()
  }

  func didDismissFullscreen() {
    guard let parent = fullscreenParent, let playerViewController, let playerView else { return }
    fullscreenParent = nil
    fullscreenTransitionInProgress = false

    parent.addChild(playerViewController)
    playerViewController.view.frame = playerView.bounds
    playerView.addSubview(playerViewController.view)
    playerViewController.didMove(toParent: parent)

    if let focusView = fullscreenFocusView, focusView.window != nil,
      let focusSystem = UIFocusSystem.focusSystem(for: focusView) {
      focusSystem.requestFocusUpdate(to: focusView)
      focusSystem.updateFocusIfNeeded()
    }
    fullscreenFocusView = nil
    delegate?.onFullscreenChange(false)
  }
  #endif

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
