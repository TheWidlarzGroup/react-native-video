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

  public var subtitleStyle = SubtitleStyle(
    fontScale: nil, foregroundColor: nil, backgroundColor: nil, windowColor: nil, edgeType: nil, edgeColor: nil, bottomPadding: nil
  ) {
    didSet {
      DispatchQueue.main.async { [weak self] in
        self?.applySubtitleStyle()
      }
    }
  }

  private var currentItemObservation: NSKeyValueObservation?

  private func applySubtitleStyle() {
    guard let player = player as? HybridVideoPlayer else { return }
    guard let currentItem = player.player.currentItem else { return }

    currentItem.textStyleRules = SubtitleStyleUtils.buildTextStyleRules(from: subtitleStyle)

    // AVFoundation only re-renders a legible cue's appearance when the selection changes or a
    // new cue starts - a `textStyleRules` update alone is picked up on the *next* cue transition,
    // not applied to a cue that's already on screen (including a paused frame). Re-asserting the
    // current selection (without changing which option is selected) forces AVKit to redraw the
    // currently-displayed cue with the new style immediately, with no visible seek/jump.
    if let group = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .legible),
      let selectedOption = currentItem.currentMediaSelection.selectedMediaOption(in: group) {
      currentItem.select(nil, in: group)
      currentItem.select(selectedOption, in: group)
    } else if let textTrack = currentItem.tracks.first(where: { $0.assetTrack?.mediaType == .text }) {
      // No selection group (e.g. an external subtitle on a plain MP4, added as an always-on
      // composition track rather than a selectable legible option) - toggling the player item
      // track's own `isEnabled` forces AVFoundation to redraw it with the current style.
      textTrack.isEnabled = false
      textTrack.isEnabled = true
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

      // Re-applies subtitleStyle to whichever AVPlayerItem is current - .initial covers an item
      // that's already attached by the time this runs, .new covers every later source change.
      self.currentItemObservation = player.observe(\.currentItem, options: [.new, .initial]) { [weak self] _, _ in
        DispatchQueue.main.async {
          self?.applySubtitleStyle()
        }
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

    DispatchQueue.main.async {
      playerViewController.enterFullscreen(animated: true)
    }
  }

  public func exitFullscreen() throws {
    guard let playerViewController else {
      throw VideoViewError.viewIsDeallocated.error()
    }

    DispatchQueue.main.async {
      playerViewController.exitFullscreen(animated: true)
    }
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
