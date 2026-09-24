//
//  AdPlaybackGate.swift
//  ReactNativeVideo
//
//  The playback gate that enforces this feature's core invariant:
//
//      No content video frame may render before the ad SDK has resolved
//      whether a pre-roll ad is available.
//
//  This type is deliberately free of any ad-SDK (or even AVFoundation)
//  dependency so that the rule can be read, reasoned about and unit-tested on
//  its own. `GoogleIMAAdController` drives it from IMA's delegate callbacks;
//  `HybridVideoPlayer` consults `allowsContentAttachment` in exactly one place
//  (`commitPlayerItem`) before it is allowed to call
//  `AVPlayer.replaceCurrentItem(with:)`.
//
//  The gate is main-actor-only state - every mutation happens on the main
//  thread, which is where both IMA's callbacks and the player's commit path
//  already run.
//

import Foundation

/// Which kind of ad break is currently on screen. Mirrors `AdBreakKind` on the
/// JS side, but kept separate so this file stays independent of the Nitro
/// generated types.
enum AdBreakPosition: Equatable {
  case preRoll
  case midRoll
  case postRoll
}

/// The gate's state.
///
/// Only `disabled`, `contentAllowed` and `resolvedWithFailure` let content
/// attach to the `AVPlayer`. Every other state withholds it.
enum AdPlaybackGateState: Equatable {
  /// No ads are configured for the current source. The gate is permanently
  /// open and the player behaves exactly as it did before ads existed.
  case disabled

  /// Ads are configured for the current source but have not been activated
  /// yet (`autoActivate: false` and no `activateAds()` call so far).
  /// Content is withheld: this is the state a preloaded feed player sits in.
  case armed

  /// An ad request is in flight with the ad SDK.
  case requesting

  /// The ad SDK returned an ads manager and we are waiting for it to tell us
  /// whether a pre-roll will actually play.
  case evaluating

  /// An ad break is on screen. Content playback is paused/withheld.
  case adBreakActive(AdBreakPosition)

  /// The ad decision resolved (with or without an ad having played) and
  /// content is allowed to play.
  case contentAllowed

  /// A terminal ad failure. Content is allowed to play - the gate always
  /// fails open.
  case resolvedWithFailure
}

extension AdPlaybackGateState {
  /// The single predicate `HybridVideoPlayer.commitPlayerItem` consults.
  var allowsContentAttachment: Bool {
    switch self {
    case .disabled, .contentAllowed, .resolvedWithFailure:
      return true
    case .armed, .requesting, .evaluating, .adBreakActive:
      return false
    }
  }

  /// True only while an ad is actually on screen.
  var isPlayingAd: Bool {
    if case .adBreakActive = self { return true }
    return false
  }

  /// True while the gate is waiting on the ad SDK for a decision. Used to
  /// decide whether a watchdog is still meaningful.
  var isAwaitingDecision: Bool {
    switch self {
    case .requesting, .evaluating:
      return true
    case .disabled, .armed, .adBreakActive, .contentAllowed, .resolvedWithFailure:
      return false
    }
  }
}

/// Every way the gate can be moved. Expressed as an explicit event set so that
/// "can the gate stay closed forever?" is answerable by reading one function.
enum AdPlaybackGateEvent: Equatable {
  /// A new source was set that has an `ads` config attached.
  case configured(autoActivate: Bool)
  /// A new source was set that has no `ads` config, ads were deactivated, or
  /// the player is being torn down.
  case disabledByConfig
  /// `activateAds()` was called, or `play()` auto-activated an armed gate.
  case activationRequested
  /// The ad SDK handed us an ads manager.
  case adsManagerLoaded
  /// The ad SDK asked us to pause content because an ad break is starting.
  case adBreakStarted(AdBreakPosition)
  /// The ad SDK asked us to resume content because the ad break ended.
  case adBreakEnded
  /// The ad decision resolved without any ad playing (no fill, no pre-roll
  /// scheduled, or all ads completed).
  case resolvedWithoutAd
  /// Any terminal failure: request error, ad playback error, watchdog expiry,
  /// or the ad SDK not being linked in at all.
  case failed
}

/// The gate itself. Not thread-safe by design - main thread only.
final class AdPlaybackGate {
  private(set) var state: AdPlaybackGateState = .disabled

  /// Called after every transition that changes `state`. The observer is
  /// responsible for reconciling the player (attaching a stashed content item,
  /// re-applying playback intent) and for emitting `onAdStateChange`.
  var onStateChange: ((_ previous: AdPlaybackGateState, _ current: AdPlaybackGateState) -> Void)?

  var allowsContentAttachment: Bool { state.allowsContentAttachment }
  var isPlayingAd: Bool { state.isPlayingAd }

  @discardableResult
  func apply(_ event: AdPlaybackGateEvent) -> AdPlaybackGateState {
    let next = AdPlaybackGate.transition(from: state, on: event)
    guard next != state else { return state }
    let previous = state
    state = next
    onStateChange?(previous, next)
    return next
  }

  /// The whole rule set, as one total function.
  ///
  /// Two invariants hold by construction and are worth stating explicitly:
  ///
  /// 1. **Fail-open.** `.failed` maps every non-`disabled` state to
  ///    `.resolvedWithFailure`, which allows content. There is therefore no
  ///    state from which a failure can leave the gate closed.
  /// 2. **No content before the decision.** The only transitions *into* a
  ///    content-allowing state are `.adBreakEnded`, `.resolvedWithoutAd` and
  ///    `.failed` - i.e. the gate can only open once the ad SDK has told us
  ///    something. Nothing time-based appears here.
  static func transition(
    from state: AdPlaybackGateState,
    on event: AdPlaybackGateEvent
  ) -> AdPlaybackGateState {
    switch event {
    case .disabledByConfig:
      return .disabled

    case .configured(let autoActivate):
      // A fresh source always restarts the cycle, regardless of where the
      // previous source's ad session had got to.
      return autoActivate ? .requesting : .armed

    case .activationRequested:
      switch state {
      case .disabled:
        // Ads were never configured for this source - activation is a no-op
        // and must not close the gate.
        return .disabled
      case .armed:
        return .requesting
      case .requesting, .evaluating, .adBreakActive, .contentAllowed, .resolvedWithFailure:
        // Already activated (or already resolved). Re-activating must never
        // re-close an open gate.
        return state
      }

    case .adsManagerLoaded:
      switch state {
      case .requesting:
        return .evaluating
      case .disabled, .armed, .evaluating, .adBreakActive, .contentAllowed, .resolvedWithFailure:
        return state
      }

    case .adBreakStarted(let position):
      switch state {
      case .disabled:
        // Ads are off for this source; a stray callback must not gate content.
        return .disabled
      case .armed, .requesting, .evaluating, .contentAllowed, .adBreakActive:
        return .adBreakActive(position)
      case .resolvedWithFailure:
        // We already failed open for this session (e.g. the watchdog fired).
        // A late ad break must not yank content back off screen.
        return .resolvedWithFailure
      }

    case .adBreakEnded:
      switch state {
      case .adBreakActive:
        return .contentAllowed
      case .disabled, .resolvedWithFailure:
        return state
      case .armed, .requesting, .evaluating, .contentAllowed:
        // Content resume without a break we tracked: open anyway.
        return .contentAllowed
      }

    case .resolvedWithoutAd:
      switch state {
      case .disabled:
        return .disabled
      case .adBreakActive:
        // ALL_ADS_COMPLETED can arrive while the last ad is still finishing;
        // the break's own end event opens the gate.
        return state
      case .resolvedWithFailure:
        return .resolvedWithFailure
      case .armed, .requesting, .evaluating, .contentAllowed:
        return .contentAllowed
      }

    case .failed:
      switch state {
      case .disabled:
        return .disabled
      case .contentAllowed:
        // Already open - a non-fatal late failure must not downgrade us.
        return .contentAllowed
      case .armed, .requesting, .evaluating, .adBreakActive, .resolvedWithFailure:
        return .resolvedWithFailure
      }
    }
  }
}
