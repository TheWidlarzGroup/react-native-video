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
    viewManager?.onPictureInPictureChange?(isActive)
  }
  
  func onFullscreenChange(_ isActive: Bool) {
    viewManager?.onFullscreenChange?(isActive)
  }
  
  func willEnterFullscreen() {
    viewManager?.willEnterFullscreen?()
  }
  
  func willExitFullscreen() {
    viewManager?.willExitFullscreen?()
  }
  
  func willEnterPictureInPicture() {
    viewManager?.willEnterPictureInPicture?()
  }
  
  func willExitPictureInPicture() {
    viewManager?.willExitPictureInPicture?()
  }
  
  func onReadyToDisplay() {
    viewManager?.player?.eventEmitter.onReadyToDisplay()
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
    delegate?.onPictureInPictureChange(false)
  }
  
  func playerViewControllerWillStartPictureInPicture(_: AVPlayerViewController) {
    delegate?.willEnterPictureInPicture()
  }
  
  func playerViewControllerWillStopPictureInPicture(_: AVPlayerViewController) {
    delegate?.willExitPictureInPicture()
  }
  
  func playerViewController(
    _: AVPlayerViewController,
    willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    delegate?.willExitFullscreen()
    
    coordinator.animate(alongsideTransition: nil) { [weak self] _ in
      guard let self = self else { return }
      self.delegate?.onFullscreenChange(false)
    }
  }
  
  func playerViewController(
    _: AVPlayerViewController,
    willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
  ) {
    delegate?.willEnterFullscreen()
    
    coordinator.animate(alongsideTransition: nil) { [weak self] _ in
      guard let self = self else { return }
      self.delegate?.onFullscreenChange(true)
    }
  }
}
