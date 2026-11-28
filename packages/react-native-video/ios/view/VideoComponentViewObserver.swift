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
    get {
      return view?.delegate
    }
  }
  
  var playerViewController: AVPlayerViewController? {
    return view?.playerViewController
  }
  
  // playerViewController observers
  var onReadyToDisplayObserver: NSKeyValueObservation?

  // Fullscreen state, tracked from the delegate callbacks. AVKit asserts when a fullscreen
  // transition is requested while another one is still running (#4774).
  private(set) var isFullscreen = false
  private(set) var isFullscreenTransitioning = false
  // True from the moment a transition is requested from JS until AVKit reports that it
  // started. The delegate can be called a run-loop turn later, and a second call made in
  // that gap would otherwise see both flags above as false.
  private(set) var isFullscreenRequestPending = false
  // The last state asked for while a transition was running. Applied when it ends, so the
  // view finishes where the app asked it to be.
  var queuedFullscreenTarget: Bool?
  private var fullscreenRequestTimeout: DispatchWorkItem?

  /// AVKit starts no transition when it has nothing to do (no window, already there), so the
  /// pending flag also clears on its own.
  private static let fullscreenRequestTimeoutSeconds = 1.0

  var isFullscreenBusy: Bool {
    isFullscreenTransitioning || isFullscreenRequestPending
  }

  /// Call right before asking AVKit to enter or exit fullscreen.
  func fullscreenRequestWillStart() {
    isFullscreenRequestPending = true
    fullscreenRequestTimeout?.cancel()
    let timeout = DispatchWorkItem { [weak self] in
      guard let self, self.isFullscreenRequestPending else { return }
      self.isFullscreenRequestPending = false
      self.view?.applyQueuedFullscreenRequest()
    }
    fullscreenRequestTimeout = timeout
    DispatchQueue.main.asyncAfter(
      deadline: .now() + Self.fullscreenRequestTimeoutSeconds, execute: timeout)
  }

  /// The value last sent as `onFullscreenChange`, so that a state change is reported once
  /// even if both the delegate and the exit request's completion handler see it.
  private var reportedFullscreen = false

  private func reportFullscreen(_ value: Bool) {
    isFullscreen = value
    guard reportedFullscreen != value else { return }
    reportedFullscreen = value
    delegate?.onFullscreenChange(value)
  }

  /// Called when an exit requested with `exitFullscreen()` has completed. The delegate
  /// normally reports the exit before this runs. If AVKit left fullscreen without calling it,
  /// the state is corrected here, or `isFullscreen` would stay true and the next
  /// `enterFullscreen()` would be dropped as "already fullscreen".
  func fullscreenExitRequestDidComplete() {
    guard isFullscreen, !isFullscreenTransitioning else { return }
    fullscreenRequestTimeout?.cancel()
    fullscreenRequestTimeout = nil
    isFullscreenRequestPending = false
    // As the delegate does on a normal exit: give the orientation back (fullscreenOrientation).
    (playerViewController as? VideoPlayerViewController)?.fullscreenDidEnd()
    reportFullscreen(false)
    DispatchQueue.main.async { [weak self] in
      self?.runPendingAfterFullscreenTransition()
      self?.view?.applyQueuedFullscreenRequest()
    }
  }

  private func fullscreenTransitionDidStart() {
    isFullscreenRequestPending = false
    fullscreenRequestTimeout?.cancel()
    fullscreenRequestTimeout = nil
    isFullscreenTransitioning = true
  }

  private func fullscreenTransitionDidEnd() {
    isFullscreenTransitioning = false
    // Not from inside the coordinator's completion: AVKit is still unwinding the transition.
    DispatchQueue.main.async { [weak self] in
      self?.runPendingAfterFullscreenTransition()
      self?.view?.applyQueuedFullscreenRequest()
    }
  }

  // Runs once when the transition that is running (or requested) now has ended, also after the
  // view that started it is gone. The closure holds this observer, the delegate of the fullscreen
  // controller, so the end of the transition is still reported to it.
  private var afterFullscreenTransition: (() -> Void)?

  /// `action` gets this observer, with `isFullscreen` already set by the finished transition.
  /// If no transition starts or ends, it runs after a timeout instead.
  func runAfterFullscreenTransition(_ action: @escaping (VideoComponentViewObserver) -> Void) {
    afterFullscreenTransition = { action(self) }
    DispatchQueue.main.asyncAfter(
      deadline: .now() + Self.fullscreenRequestTimeoutSeconds + 1.5
    ) { [weak self] in
      self?.runPendingAfterFullscreenTransition()
    }
  }

  private func runPendingAfterFullscreenTransition() {
    let action = afterFullscreenTransition
    afterFullscreenTransition = nil
    action?()
  }

  /// The controller was replaced or the view is going away: nothing tracked here describes
  /// the new controller, and a stale `true` would block every later request.
  func resetFullscreenState(keepingFullscreen: Bool = false) {
    fullscreenRequestTimeout?.cancel()
    fullscreenRequestTimeout = nil
    isFullscreenRequestPending = false
    isFullscreenTransitioning = false
    queuedFullscreenTarget = nil
    if !keepingFullscreen {
      isFullscreen = false
      // Nothing is sent here, as before: the next real change must still be reported.
      reportedFullscreen = false
    }
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
  
  func playerViewControllerDidStartPictureInPicture(_: AVPlayerViewController) {
    delegate?.onPictureInPictureChange(true)
  }
  
  func playerViewControllerDidStopPictureInPicture(_: AVPlayerViewController) {
    view?.isPictureInPictureActive = false
    delegate?.onPictureInPictureChange(false)
  }
  
  func playerViewControllerWillStartPictureInPicture(_: AVPlayerViewController) {
    view?.isPictureInPictureActive = true
    VideoManager.shared.pictureInPictureWillStart(view: view)
    delegate?.willEnterPictureInPicture()
  }

  func playerViewControllerShouldAutomaticallyDismissAtPictureInPictureStart(_: AVPlayerViewController) -> Bool {
    // AVKit closes native fullscreen when picture in picture starts, unless told otherwise.
    // Closing it leaves nothing to come back to: after the restore button the player lands
    // inline or disappears (#4897). Keeping fullscreen up lets picture in picture return to it.
    return !isFullscreen
  }

  func playerViewController(_: AVPlayerViewController, failedToStartPictureInPictureWithError _: Error) {
    view?.isPictureInPictureActive = false
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
    _ playerViewController: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    let fullscreenController = playerViewController as? VideoPlayerViewController
    delegate?.willExitFullscreen()
    fullscreenTransitionDidStart()
    // AVKit pauses the player when native fullscreen is dismissed; resume it, as v6 does.
    let player = playerViewController.player
    let wasPlaying = player?.timeControlStatus == .playing

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }
      // Runs after the flags below are final, on every path out of this block.
      defer { self.fullscreenTransitionDidEnd() }

      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen dismiss
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }

        self.delegate?.willEnterFullscreen()

        return
      }

      fullscreenController?.fullscreenDidEnd()
      self.reportFullscreen(false)
      if wasPlaying {
        player?.play()
      }
    }
  }
  
  func playerViewController(
    _ playerViewController: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    let fullscreenController = playerViewController as? VideoPlayerViewController
    fullscreenController?.fullscreenWillBegin()
    delegate?.willEnterFullscreen()
    fullscreenTransitionDidStart()

    coordinator.animate(alongsideTransition: nil) { [weak self] context in
      guard let self = self else { return }
      // Runs after the flags below are final, on every path out of this block.
      defer { self.fullscreenTransitionDidEnd() }

      if context.isCancelled {
        // iOS bug: window.isUserInteractionEnabled is left as false after cancelled fullscreen transition
        if let window = self.playerViewController?.view.window, !window.isUserInteractionEnabled {
          window.isUserInteractionEnabled = true
        }

        fullscreenController?.fullscreenDidEnd()
        self.delegate?.willExitFullscreen()

        return
      }

      self.reportFullscreen(true)
    }
  }
}
