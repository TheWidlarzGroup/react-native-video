//
//  VideoComponentViewObserver.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 06/05/2025.
//

import Foundation
import AVKit
import AVFoundation

protocol VideoComponentViewDelegate: AnyObject {
  func onPictureInPictureChange(_ isActive: Bool)
  func onFullscreenChange(_ isActive: Bool)
  func willEnterFullscreen()
  func willExitFullscreen()
  func willEnterPictureInPicture()
  func willExitPictureInPicture()
  func onReadyToDisplay()
}

// Map delegate methods to view manager methods
final class VideoViewDelegate: NSObject, VideoComponentViewDelegate {
  weak var viewManager: HybridVideoViewViewManager?
  
  init(viewManager: HybridVideoViewViewManager) {
    self.viewManager = viewManager
  }
  
  func onPictureInPictureChange(_ isActive: Bool) {
    viewManager?.onPictureInPictureChange(isActive)
  }
  
  func onFullscreenChange(_ isActive: Bool) {
    viewManager?.onFullscreenChange(isActive)
  }
  
  func willEnterFullscreen() {
    viewManager?.willEnterFullscreen()
  }
  
  func willExitFullscreen() {
    viewManager?.willExitFullscreen()
  }
  
  func willEnterPictureInPicture() {
    viewManager?.willEnterPictureInPicture()
  }
  
  func willExitPictureInPicture() {
    viewManager?.willExitPictureInPicture()
  }
  
  func onReadyToDisplay() {
    if let player = viewManager?.player as? HybridVideoPlayer {
      player._eventEmitter?.onReadyToDisplay()
    }
  }
}

/// Keeps the interface orientation in step with the phone while the video is fullscreen.
/// AVKit's fullscreen does not follow device rotation on its own when the host app's
/// root view controller is portrait-biased (the video then stays portrait or is drawn
/// sideways), so rotation is requested explicitly through the window scene.
final class FullscreenOrientationHandler {
  private let playerViewController: () -> AVPlayerViewController?
  private var isActive = false

  init(playerViewController: @escaping () -> AVPlayerViewController?) {
    self.playerViewController = playerViewController
  }

  func start() {
    guard !isActive else { return }
    isActive = true
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self, selector: #selector(deviceOrientationDidChange),
      name: UIDevice.orientationDidChangeNotification, object: nil)

    // Entering while the phone is already on its side: go landscape right away. A phone
    // held upright is left to AVKit, which turns landscape video sideways by itself.
    if UIDevice.current.orientation.isLandscape {
      apply(UIDevice.current.orientation)
    }
  }

  func stop() {
    guard isActive else { return }
    isActive = false
    NotificationCenter.default.removeObserver(
      self, name: UIDevice.orientationDidChangeNotification, object: nil)
    UIDevice.current.endGeneratingDeviceOrientationNotifications()

    // Back inline: follow the phone, portrait if it is flat or unknown.
    let current = UIDevice.current.orientation
    apply(current.isLandscape ? current : .portrait)
  }

  deinit {
    if isActive {
      NotificationCenter.default.removeObserver(self)
      UIDevice.current.endGeneratingDeviceOrientationNotifications()
    }
  }

  @objc private func deviceOrientationDidChange() {
    let orientation = UIDevice.current.orientation
    // Face up/down and upside-down are ignored: they say nothing about how to lay out.
    guard orientation.isLandscape || orientation == .portrait else { return }
    apply(orientation)
  }

  func apply(_ deviceOrientation: UIDeviceOrientation) {
    // Device and interface landscape are mirrored.
    let mask: UIInterfaceOrientationMask
    switch deviceOrientation {
    case .landscapeLeft: mask = .landscapeRight
    case .landscapeRight: mask = .landscapeLeft
    default: mask = .portrait
    }

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let controller = self.playerViewController()
      let window = controller?.view.window
        ?? UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.windows.first }.first

      if #available(iOS 16.0, *) {
        controller?.setNeedsUpdateOfSupportedInterfaceOrientations()
        window?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
        // Denied when the host app does not allow that orientation: nothing to do then.
        window?.windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { _ in }
      } else {
        let target: UIInterfaceOrientation = mask == .landscapeRight ? .landscapeRight
          : mask == .landscapeLeft ? .landscapeLeft : .portrait
        UIDevice.current.setValue(target.rawValue, forKey: "orientation")
        UIViewController.attemptRotationToDeviceOrientation()
      }
    }
  }
}

class VideoComponentViewObserver: NSObject, AVPlayerViewControllerDelegate {
  private weak var view: VideoComponentView?
  
  var delegate: VideoViewDelegate? {
    get {
      return view?.delegate
    }
  }
  
  var playerViewController: AVPlayerViewController? {
    return view?.playerViewController
  }
  
  // playerViewController observers
  var onReadyToDisplayObserver: NSKeyValueObservation?

  private lazy var orientationHandler = FullscreenOrientationHandler { [weak self] in
    self?.playerViewController
  }
  
  init(view: VideoComponentView) {
    self.view = view
    super.init()
  }
  
  func initializePlayerViewContorollerObservers() {
    guard let playerViewController = playerViewController else {
      return
    }
    
    onReadyToDisplayObserver = playerViewController.observe(\.isReadyForDisplay, options: [.new]) { [weak self] _, change in
      guard let self = self else { return }
      if change.newValue == true {
        self.delegate?.onReadyToDisplay()
      }
    }
  }
  
  func removePlayerViewControllerObservers() {
    onReadyToDisplayObserver?.invalidate()
    onReadyToDisplayObserver = nil
  }
  
  func updatePlayerViewControllerObservers() {
    removePlayerViewControllerObservers()
    initializePlayerViewContorollerObservers()
  }
  
  /// AVKit can rebuild the `contentOverlayView` subtree when it re-parents the
  /// player view for fullscreen or PiP, which would orphan the IMA ad
  /// container. Re-assert it after every such transition.
  private func reassertAdContainer() {
    view?.reassertAdContainer()
  }

  func playerViewControllerDidStartPictureInPicture(_: AVPlayerViewController) {
    delegate?.onPictureInPictureChange(true)
    reassertAdContainer()
  }

  func playerViewControllerDidStopPictureInPicture(_: AVPlayerViewController) {
    delegate?.onPictureInPictureChange(false)
    reassertAdContainer()
  }
  
  func playerViewControllerWillStartPictureInPicture(_: AVPlayerViewController) {
    delegate?.willEnterPictureInPicture()
  }
  
  func playerViewControllerWillStopPictureInPicture(_: AVPlayerViewController) {
    delegate?.willExitPictureInPicture()
  }

  func playerViewControllerRestoreUserInterfaceForPictureInPictureStop(
    _ playerViewController: AVPlayerViewController,
    completionHandler: @escaping (Bool) -> Void
  ) {
    let isViewAttached = view?.window != nil
    completionHandler(isViewAttached)
  }
  
  func playerViewController(
    _: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    delegate?.willExitFullscreen()

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }
        
      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen dismiss
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }

        self.delegate?.willEnterFullscreen()
        self.reassertAdContainer()

        return
      }

      self.orientationHandler.stop()
      self.delegate?.onFullscreenChange(false)
      self.reassertAdContainer()
    }
  }
  
  func playerViewController(
    _: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    delegate?.willEnterFullscreen()

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }

      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen transition
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }

        self.delegate?.willExitFullscreen()
        self.reassertAdContainer()

        return
      }

      self.orientationHandler.start()
      self.delegate?.onFullscreenChange(true)
      self.reassertAdContainer()
    }
  }
}
