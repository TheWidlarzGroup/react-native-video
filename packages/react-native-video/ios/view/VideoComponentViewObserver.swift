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

class VideoComponentViewObserver: NSObject, AVPlayerViewControllerDelegate {
  private weak var view: VideoComponentView?

  var delegate: VideoViewDelegate? {
    return view?.delegate
  }

  var playerViewController: AVPlayerViewController? {
    return view?.playerViewController
  }

  // playerViewController observers
  var onReadyToDisplayObserver: NSKeyValueObservation?

  init(view: VideoComponentView) {
    self.view = view
    super.init()
  }

  // Diagnostic
  private func dumpHierarchy(_ tag: String) {
    guard let pvc = playerViewController else { return }
    NSLog("[PiPDebug] \(tag) — pvc.parent=\(String(describing: pvc.parent)) presenting=\(String(describing: pvc.presentingViewController)) view.superview=\(String(describing: pvc.view.superview)) view.window=\(String(describing: pvc.view.window))")
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

  func playerViewControllerWillStartPictureInPicture(_: AVPlayerViewController) {
#if DEBUG
    dumpHierarchy("willStart PiP")
#endif
    view?.isPictureInPictureActive = true
    delegate?.willEnterPictureInPicture()
  }

  func playerViewControllerDidStartPictureInPicture(_: AVPlayerViewController) {
#if DEBUG
    dumpHierarchy("didStart PiP")
#endif
    delegate?.onPictureInPictureChange(true)
  }

  func playerViewControllerWillStopPictureInPicture(_: AVPlayerViewController) {
#if DEBUG
    dumpHierarchy("willStop PiP")
#endif
    delegate?.willExitPictureInPicture()
  }

  func playerViewControllerDidStopPictureInPicture(_: AVPlayerViewController) {
#if DEBUG
    dumpHierarchy("didStop PiP")
#endif
    view?.isPictureInPictureActive = false
    delegate?.onPictureInPictureChange(false)

    // PiP-start ended AVKit's private fullscreen presentation in order to
    // move the player UI into the PiP window. PiP-stop brings the player
    // back into our host, but does not re-engage AVKit's fullscreen — so
    // the swipe-down and close-button chrome is missing from this point on.
    // Re-engage AVKit fullscreen here, mirroring what enterFullscreen() did
    // initially, so the dismiss UX is consistent across PiP cycles.
    if let view = self.view, view.isPresentingFullscreen {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak view] in
        guard let pvc = view?.playerViewController else { return }
#if DEBUG
        NSLog("[PiPDebug] re-engaging AVKit fullscreen after PiP stop")
#endif
        pvc.enterFullscreen(animated: false)

      }
    }
  }

  // Called when the user taps the restore button on the PiP window.
  // With the host-VC pattern, the host stays presented through PiP, so
  // there's nothing to re-present. Just acknowledge success.
  func playerViewControllerRestoreUserInterfaceForPictureInPictureStop(
    _ playerViewController: AVPlayerViewController,
    completionHandler: @escaping (Bool) -> Void
  ) {
#if DEBUG
    NSLog("[PiPDebug] 🔥 RESTORE DELEGATE CALLED")
#endif
    completionHandler(true)
  }

  func playerViewController(
    _: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
#if DEBUG
    NSLog("[PiPDebug] willBeginFullScreenPresentation FIRED")
#endif
    delegate?.willEnterFullscreen()

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }
#if DEBUG
      NSLog("[PiPDebug] willBeginFullScreenPresentation completion — cancelled=\(context.isCancelled)")
#endif

      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen dismiss
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }
        
        self.delegate?.willExitFullscreen()
        
        return
      }

      self.delegate?.onFullscreenChange(true)
    }
  }

  func playerViewController(
    _: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
#if DEBUG
    NSLog("[PiPDebug] willEndFullScreenPresentation FIRED — isPiPActive=\(view?.isPictureInPictureActive ?? false), isPresentingFullscreen=\(view?.isPresentingFullscreen ?? false)")
#endif
    delegate?.willExitFullscreen()

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }
#if DEBUG
      NSLog("[PiPDebug] willEndFullScreenPresentation completion — cancelled=\(context.isCancelled), isPiPActive=\(self.view?.isPictureInPictureActive ?? false), isPresentingFullscreen=\(self.view?.isPresentingFullscreen ?? false)")
#endif

      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen transition
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }
        
        self.delegate?.willEnterFullscreen()
        
        return
      }

      // AVKit fires willEndFullScreenPresentation in two situations that look
      // identical from this callback alone:
      //   (a) the user invoked a dismissal affordance (swipe-down, close
      //       button) — we should dismiss the host
      //   (b) PiP is starting and AVKit is moving the player UI into the PiP
      //       window — the host must stay presented so PiP can restore back
      //       into it later
      // We use isPictureInPictureActive (set in willStartPictureInPicture) to
      // distinguish: if PiP is active, this is case (b) and we skip cleanup.
      if let view = self.view,
        view.isPresentingFullscreen,
        !view.isPictureInPictureActive {
#if DEBUG
        NSLog("[PiPDebug] willEndFullScreenPresentation completion — calling dismissFromAVKit")
#endif
        view.dismissFullscreenFromAVKitSignal()
      }

      self.delegate?.onFullscreenChange(false)
    }
  }
}
