//
//  HybridVideoPlayer+Events.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 02/05/2025.
//

import Foundation
import AVFoundation

extension HybridVideoPlayer: VideoPlayerObserverDelegate {
  // MARK: - VideoPlayerObserverDelegate
  
  func onPlayedToEnd(player: AVPlayer) {
    eventEmitter.onEnd()
    
    if loop {
      currentTime = 0
      try? play()
    }
  }
  
  func onRateChanged(rate: Float) {
    eventEmitter.onPlaybackRateChange(Double(rate))
    NowPlayingInfoCenterManager.shared.updateNowPlayingInfo()
    updateAndEmitPlaybackState()
  }
  
  func onVolumeChanged(volume: Float) {
    eventEmitter.onVolumeChange(onVolumeChangeData(
      volume: Double(volume),
      muted: muted
    ))
  }
  
  func onPlaybackBufferEmpty() {
    isCurrentlyBuffering = true
    status = .loading
    updateAndEmitPlaybackState()
  }
  
  func onProgressUpdate(currentTime: Double, bufferDuration: Double) {
    eventEmitter.onProgress(.init(currentTime: currentTime, bufferDuration: bufferDuration))
  }
  
  func onPlaybackLikelyToKeepUp() {
    isCurrentlyBuffering = false
    if player.timeControlStatus == .playing {
      status = .readytoplay
    }
    updateAndEmitPlaybackState()
  }
  
  func onExternalPlaybackActiveChanged(isActive: Bool) {
    eventEmitter.onExternalPlaybackChange(isActive)
  }
  
  func onTimeControlStatusChanged(status: AVPlayer.TimeControlStatus) {
    if player.status == .failed || playerItem?.status == .failed {
      self.status = .error
      isCurrentlyBuffering = false
      eventEmitter.onPlaybackStateChange(.init(isPlaying: false, isBuffering: false))
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
      let orientation: VideoOrientation = playerItem.asset.tracks.first(where: { $0.mediaType == .video })?.orientation ?? .unknown
      
      eventEmitter.onLoad(
        .init(currentTime, duration, height, width, orientation)
      )
      
      if playerItem.isPlaybackLikelyToKeepUp && !playerItem.isPlaybackBufferEmpty {
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
    eventEmitter.onTextTrackDataChanged(texts.map { $0.string })
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
    
    eventEmitter.onTimedMetadata(.init(metadata: metadata))
  }
  
  func onBandwidthUpdate(bitrate: Double) {
    eventEmitter.onBandwidthUpdate(.init(bitrate: bitrate, width: nil, height: nil))
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
    let isPlaying = player.rate > 0 && !isCurrentlyBuffering
    
    eventEmitter.onPlaybackStateChange(.init(isPlaying: isPlaying, isBuffering: isCurrentlyBuffering))
    eventEmitter.onBuffer(isCurrentlyBuffering)
  }
}
