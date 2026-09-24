//
//  VideoAdController.swift
//  ReactNativeVideo
//
//  The seam between `HybridVideoPlayer` / `VideoComponentView` and whatever ad
//  SDK is linked in. `GoogleIMAAdController` is the only implementation today
//  and only exists when the app opted into the IMA pod (see
//  `$RNVideoUseGoogleIMA` in ReactNativeVideo.podspec).
//
//  When no ad SDK is linked, `VideoAdControllerFactory.make` returns nil and
//  every ad call site in the player degrades to "gate permanently open" - i.e.
//  exactly the pre-ads behaviour.
//
//  Main thread only.
//

import AVFoundation
import AVKit
import Foundation
import UIKit

/// Callbacks the controller needs from the player that owns it.
protocol VideoAdControllerDelegate: AnyObject {
  /// The content `AVPlayer` shared with the ad SDK (for the content playhead).
  var adControllerContentPlayer: AVPlayer { get }

  /// Emitter used for all `onAd*` events.
  var adControllerEventEmitter: HybridVideoPlayerEventEmitter? { get }

  /// The gate just closed for an ad break: stop content playback, but keep the
  /// user's play intent latched so content resumes when the break ends.
  func adControllerWillPresentAdBreak(_ controller: VideoAdControlling)

  /// The gate just opened. Attach any stashed content item and re-apply the
  /// latched play/rate intent.
  func adControllerDidOpenGate(_ controller: VideoAdControlling)

  /// The JS-visible ad state changed.
  func adController(_ controller: VideoAdControlling, didChangeState state: VideoAdState)

  /// The ad currently on screen was paused or resumed (by the app, or by the ad
  /// SDK's own UI). The content player's rate says nothing about this - ads run
  /// in the SDK's own player - so the player re-emits its playback state from
  /// here instead.
  func adControllerDidChangeAdPlaybackState(_ controller: VideoAdControlling)
}

protocol VideoAdControlling: AnyObject {
  /// The one predicate `HybridVideoPlayer.commitPlayerItem` consults before it
  /// is allowed to call `AVPlayer.replaceCurrentItem(with:)`.
  var allowsContentAttachment: Bool { get }

  /// True only while an ad is on screen.
  var isPlayingAd: Bool { get }

  /// True while an on-screen ad is paused. Meaningless unless `isPlayingAd`.
  var isAdPaused: Bool { get }

  /// JS-visible state.
  var adState: VideoAdState { get }

  /// True when the gate is configured but not yet activated - `play()` uses
  /// this to auto-activate rather than sitting behind a gate nobody opened.
  var isArmed: Bool { get }

  /// Point the controller at a new source's ad config. Tears down any
  /// in-flight ad session for the previous source and bumps the generation
  /// token so its late callbacks are ignored. `nil` disables ads entirely.
  func configure(with config: VideoAdsConfig?)

  /// Request ads. Safe to call repeatedly; only the first call per source
  /// does anything. `completion` runs once the ad decision is known (or
  /// immediately if it already is) - it never fails.
  func activate(completion: @escaping () -> Void)

  /// Abandon ads for this source and open the gate.
  func deactivate()

  /// Signals that content playback reached its end, so the ad SDK can play a
  /// post-roll if the ad tag scheduled one.
  func contentDidComplete()

  /// Skip the current ad, if the SDK allows it.
  func skipAd()

  /// Pause/resume the currently playing ad.
  func pauseAd()
  func resumeAd()

  /// Attach the ad UI container into AVKit's `contentOverlayView`. Called from
  /// the view layer whenever an `AVPlayerViewController` is (re)configured.
  func attach(to playerViewController: AVPlayerViewController)

  /// Re-assert the ad container into `contentOverlayView`. AVKit can rebuild
  /// that view tree across fullscreen / PiP transitions.
  func reassertAdContainer()

  /// Tear everything down. Must run before the player drops its current item.
  func destroy()
}

/// The view IMA renders its ad UI into.
///
/// IMA refuses an ad request whose container is not in the view hierarchy (and
/// reports `ADSLOT_NOT_VISIBLE` for a zero-sized one), and the container is
/// created before the RN view has a window or a layout pass. Rather than
/// guessing when that becomes true from the view layer, the container reports
/// its own readiness.
final class AdContainerView: UIView {
  /// Called whenever this view may have become request-ready: it moved into a
  /// window, or it was laid out to a non-zero size.
  var onReadinessChange: (() -> Void)?

  /// IMA's precondition for accepting an ads request.
  var isReadyForAdRequest: Bool {
    window != nil && bounds.width > 0 && bounds.height > 0
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if isReadyForAdRequest { onReadinessChange?() }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if isReadyForAdRequest { onReadinessChange?() }
  }
}

enum VideoAdControllerFactory {
  /// Returns a live controller when an ad SDK is compiled in, otherwise nil.
  static func make(delegate: VideoAdControllerDelegate) -> VideoAdControlling? {
    #if RNV_GOOGLE_IMA
      return GoogleIMAAdController(delegate: delegate)
    #else
      return nil
    #endif
  }
}

// MARK: - Shared helpers

extension AdPlaybackGateState {
  /// Projection onto the JS-visible `VideoAdState`.
  var videoAdState: VideoAdState {
    switch self {
    case .disabled: return .idle
    case .armed: return .activating
    // `evaluating` is still "we are asking the ad server", which is what
    // `requesting` means to JS. There is no separate JS state for it.
    case .requesting, .evaluating: return .requesting
    case .adBreakActive: return .playing
    case .contentAllowed: return .content
    case .resolvedWithFailure: return .failed
    }
  }
}

extension AdBreakPosition {
  var adBreakKind: AdBreakKind {
    switch self {
    case .preRoll: return .preroll
    case .midRoll: return .midroll
    case .postRoll: return .postroll
    }
  }
}
