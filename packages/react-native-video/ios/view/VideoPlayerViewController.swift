//
//  VideoPlayerViewController.swift
//  ReactNativeVideo
//

import AVKit
import UIKit

/// `AVPlayerViewController` that can limit the interface orientations of native fullscreen.
/// AVKit asks the player view controller for its supported orientations while the
/// fullscreen presentation is on screen, so the limit applies there and nowhere else.
final class VideoPlayerViewController: AVPlayerViewController {
  var fullscreenOrientation: FullscreenOrientation = .all {
    didSet { updateSupportedOrientations() }
  }

  var fullscreenAutorotate: Bool = true {
    didSet { updateSupportedOrientations() }
  }

  private var isInFullscreen = false
  /// With autorotate, the requested orientation is held until the user has turned
  /// the device to it. Without this, iOS would rotate straight back to the way the
  /// device is held.
  private var holdsRequestedOrientation = false
  #if os(iOS)
  /// The interface orientation fullscreen was opened from, to go back to on exit.
  private var orientationBeforeFullscreen: UIInterfaceOrientation?
  #endif

  func fullscreenWillBegin() {
    isInFullscreen = true
    holdsRequestedOrientation = true
    #if os(iOS)
    orientationBeforeFullscreen = view.window?.windowScene?.interfaceOrientation
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(deviceOrientationDidChange),
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )
    #endif
    updateSupportedOrientations()
  }

  func fullscreenDidEnd() {
    guard isInFullscreen else { return }
    isInFullscreen = false
    holdsRequestedOrientation = false
    #if os(iOS)
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
    let deviceOrientation = UIDevice.current.orientation
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    #endif
    updateSupportedOrientations()
    #if os(iOS)
    restoreOrientationIfDeviceIsFlat(deviceOrientation)
    orientationBeforeFullscreen = nil
    #endif
  }

  #if os(iOS)
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    guard isInFullscreen, let mask = fullscreenOrientation.interfaceOrientationMask else {
      return super.supportedInterfaceOrientations
    }
    if fullscreenAutorotate && !holdsRequestedOrientation {
      return super.supportedInterfaceOrientations
    }
    return mask
  }

  /// iOS turns the interface back by itself when it knows how the device is held.
  /// A device that lies flat reports no usable orientation, and the app would stay in
  /// the fullscreen orientation, so the one from before fullscreen is requested.
  private func restoreOrientationIfDeviceIsFlat(_ deviceOrientation: UIDeviceOrientation) {
    guard fullscreenOrientation != .all,
      !deviceOrientation.isValidInterfaceOrientation,
      let before = orientationBeforeFullscreen,
      let scene = view.window?.windowScene,
      scene.interfaceOrientation != before
    else { return }

    if #available(iOS 16.0, *) {
      let mask: UIInterfaceOrientationMask
      switch before {
      case .portrait: mask = .portrait
      case .portraitUpsideDown: mask = .portraitUpsideDown
      case .landscapeLeft: mask = .landscapeLeft
      case .landscapeRight: mask = .landscapeRight
      default: return
      }
      scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
    }
  }

  @objc private func deviceOrientationDidChange() {
    guard isInFullscreen, holdsRequestedOrientation, fullscreenAutorotate else { return }
    let device = UIDevice.current.orientation
    let matches: Bool
    switch fullscreenOrientation {
    case .landscape:
      matches = device.isLandscape
    case .portrait:
      matches = device == .portrait
    case .all:
      matches = true
    }
    if matches {
      holdsRequestedOrientation = false
      updateSupportedOrientations()
    }
  }
  #endif

  private func updateSupportedOrientations() {
    #if os(iOS)
    if #available(iOS 16.0, *) {
      setNeedsUpdateOfSupportedInterfaceOrientations()
    }
    #endif
  }
}

#if os(iOS)
private extension FullscreenOrientation {
  var interfaceOrientationMask: UIInterfaceOrientationMask? {
    switch self {
    case .all:
      return nil
    case .landscape:
      return .landscape
    case .portrait:
      return .portrait
    }
  }
}
#endif
