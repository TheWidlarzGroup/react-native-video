//
//  HybridVideoPlayer+Events.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 02/05/2025.
//

import AVFoundation
import Foundation

extension HybridVideoPlayer: VideoPlayerObserverDelegate {
  // MARK: - VideoPlayerObserverDelegate

  func onPlayedToEnd(player: AVPlayer) {
    _eventEmitter?.onEnd()

    // Finished — don't resume it on return.
    wasPlayingInBackground = false

    // Tell the ad SDK the content is over so it can play a post-roll. Without
    // this, a post-roll scheduled by the ad tag never fires: the SDK only ever
    // sees the content playhead stop short of the end.
    adController?.contentDidComplete()

    if loop {
      currentTime = 0
      try? play()
    }
  }

  func onRateChanged(rate: Float, reason: AVPlayer.RateDidChangeReason?) {
    _eventEmitter?.onPlaybackRateChange(Double(rate))
    NowPlayingInfoCenterManager.shared.updatePlaybackState()
    updateAndEmitPlaybackState()

    // A deliberate pause (PiP controls, app UI, lock screen) reports .setRateCalled; a system
    // background pause reports .appBackgrounded. Only the former cancels the background-resume
    // intent, so a video paused inside PiP isn't auto-resumed on return.
    if rate == 0, reason == .setRateCalled {
      wasPlayingInBackground = false
    }
  }

  func onVolumeChanged(volume: Float) {
    _eventEmitter?.onVolumeChange(
      onVolumeChangeData(
        volume: Double(volume),
        muted: muted
      )
    )
  }

  func onPlaybackBufferEmpty() {
    isCurrentlyBuffering = true
    status = .loading
    updateAndEmitPlaybackState()
  }

  func onProgressUpdate(currentTime: Double, bufferDuration: Double) {
    _eventEmitter?.onProgress(
      .init(currentTime: currentTime, bufferDuration: bufferDuration)
    )
  }

  func onPlaybackLikelyToKeepUp() {
    isCurrentlyBuffering = false
    if player.timeControlStatus != .waitingToPlayAtSpecifiedRate {
      status = .readytoplay
    }
    updateAndEmitPlaybackState()
  }

  func onExternalPlaybackActiveChanged(isActive: Bool) {
    _eventEmitter?.onExternalPlaybackChange(isActive)
  }

  func onTimeControlStatusChanged(status: AVPlayer.TimeControlStatus) {
    if player.status == .failed || playerItem?.status == .failed {
      self.status = .error
      isCurrentlyBuffering = false
      _eventEmitter?.onPlaybackStateChange(
        .init(isPlaying: false, isBuffering: false)
      )
      return
    }

    switch status {
    case .waitingToPlayAtSpecifiedRate:
      isCurrentlyBuffering = true
      self.status = .loading
      break

    case .playing:
      isCurrentlyBuffering = false
      self.status = .readytoplay
      break

    case .paused:
      isCurrentlyBuffering = false
      self.status = .readytoplay
      break

    @unknown default:
      break
    }

    updateAndEmitPlaybackState()

    // Keep the audio session in sync with playback: starting/stopping changes whether we hold
    // the session and the mix mode (mix-with-others vs interrupt), which is otherwise only
    // recomputed on prop/lifecycle changes — not on play/pause.
    VideoManager.shared.requestAudioSessionUpdate()
  }

  func onPlayerStatusChanged(status: AVPlayer.Status) {
    if status == .failed || playerItem?.status == .failed {
      self.status = .error
      isCurrentlyBuffering = false
      updateAndEmitPlaybackState()
    }
  }

  func onPlayerItemStatusChanged(status: AVPlayerItem.Status) {
    if status == .failed {
      self.status = .error
      isCurrentlyBuffering = false
      updateAndEmitPlaybackState()
      return
    }

    switch status {
    case .unknown:
      isCurrentlyBuffering = true
      self.status = .loading

      // Set initial buffering state when we have a playerItem
      if let playerItem = self.playerItem {
        if playerItem.isPlaybackBufferEmpty {
          isCurrentlyBuffering = true
        }
      }

    case .readyToPlay:
      guard let playerItem else { return }

      let height = playerItem.presentationSize.height
      let width = playerItem.presentationSize.width
      let orientation: VideoOrientation =
        playerItem.asset.tracks.first(where: { $0.mediaType == .video })?
        .orientation ?? .unknown

      _eventEmitter?.onLoad(
        .init(currentTime, duration, height, width, orientation)
      )

      if playerItem.isPlaybackLikelyToKeepUp
        && !playerItem.isPlaybackBufferEmpty
      {
        isCurrentlyBuffering = false
        self.status = .readytoplay
      }

    case .failed:
      self.status = .error
      isCurrentlyBuffering = false

    @unknown default:
      break
    }

    updateAndEmitPlaybackState()
  }

  func onTextTrackDataChanged(texts: [NSAttributedString]) {
    _eventEmitter?.onTextTrackDataChanged(texts.map { $0.string })
  }

  func onTimedMetadataChanged(timedMetadata: [AVMetadataItem]) {
    var metadata: [TimedMetadataObject] = []
    for item in timedMetadata {
      let value = item.value as? String
      let identifier = item.identifier?.rawValue

      if let value, let identifier {
        metadata.append(.init(value: value, identifier: identifier))
      }
    }

    _eventEmitter?.onTimedMetadata(.init(metadata: metadata))
  }

  func onBandwidthUpdate(bitrate: Double) {
    _eventEmitter?.onBandwidthUpdate(
      .init(bitrate: bitrate, width: nil, height: nil)
    )
  }

  func onPlayerItemChange(player _: AVPlayer, playerItem: AVPlayerItem?) {
    guard showNotificationControls, let playerItem else { return }
    DispatchQueue.main.async {
      NowPlayingInfoCenterManager.shared.updateStaticInfo(ifCurrentItem: playerItem)
    }
  }

  func onPlayerItemWillChange(hasNewPlayerItem: Bool) {
    if hasNewPlayerItem {
      // Set initial buffering state when playerItem is assigned
      isCurrentlyBuffering = true
      status = .loading
      updateAndEmitPlaybackState()
    } else {
      // Clean up state when playerItem is cleared
      isCurrentlyBuffering = false
    }
  }

  func updateAndEmitPlaybackState() {
    // While an ad break is on screen the content player is deliberately paused
    // underneath it and its item may not even be attached yet, so its rate and
    // buffering state describe something the viewer cannot see. Report the ad's
    // own state instead - which is what `isPlaying` (the property) already
    // does, and what Android reports naturally because ads there share the
    // content player. Without this, an app driving a play/pause button off
    // `onPlaybackStateChange` sees `isPlaying: false` for the whole break and
    // its "resume" call lands on `resumeAd()` of an already-playing ad, i.e.
    // taps appear to do nothing at all.
    if let adController, adController.isPlayingAd {
      _eventEmitter?.onPlaybackStateChange(
        .init(isPlaying: !adController.isAdPaused, isBuffering: false)
      )
      _eventEmitter?.onBuffer(false)
      return
    }

    let isPlaying = player.rate > 0 && !isCurrentlyBuffering

    _eventEmitter?.onPlaybackStateChange(
      .init(isPlaying: isPlaying, isBuffering: isCurrentlyBuffering)
    )
    _eventEmitter?.onBuffer(isCurrentlyBuffering)
  }
}
