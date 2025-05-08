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
  }
  
  func onVolumeChanged(volume: Float) {
    eventEmitter.onVolumeChange(Double(volume))
  }
  
  func onPlaybackBufferEmpty() {
    if playerItem?.isPlaybackBufferEmpty == true {
      eventEmitter.onBuffer(true)
      status = .loading
    }
  }
  
  func onProgressUpdate(currentTime: Double, bufferDuration bufferDuration: Double) {
    eventEmitter.onProgress(.init(currentTime: currentTime, bufferDuration: bufferDuration))
  }
  
  func onPlaybackLikelyToKeepUp() {
    guard let playerItem else {
      return
    }
    
    if !playerItem.isPlaybackBufferEmpty && playerItem.isPlaybackBufferEmpty {
      eventEmitter.onBuffer(true)
      status = .loading
    } else if playerItem.isPlaybackLikelyToKeepUp {
      eventEmitter.onBuffer(false)
      status = .readytoplay
    }
  }
  
  func onExternalPlaybackActiveChanged(isActive: Bool) {
    eventEmitter.onExternalPlaybackChange(isActive)
  }
  
  func onTimeControlStatusChanged(status: AVPlayer.TimeControlStatus) {
    // check for error
    if playerPointer.status == .failed || playerItem?.status == .failed {
      self.status = .error
      eventEmitter.onPlaybackStateChange(.init(isPlaying: false, isBuffering: false))
      return
    }
    
    // check if player is waiting to play at specified rate
    if playerPointer.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      self.status = .loading
      return
    }
    
    self.status = .readytoplay
    
    // check for playback state
    switch playerPointer.timeControlStatus {
    case .playing:
      eventEmitter.onPlaybackStateChange(.init(isPlaying: true, isBuffering: playerItem?.isPlaybackBufferEmpty == true))
    case .paused:
      eventEmitter.onPlaybackStateChange(.init(isPlaying: false, isBuffering: playerItem?.isPlaybackBufferEmpty == true))
    default:
      break
    }
  }
  
  func onPlayerStatusChanged(status: AVPlayer.Status) {
    // check for error
    if status == .failed || playerItem?.status == .failed {
      self.status = .error
    }
  }
  
  func onPlayerItemStatusChanged(status: AVPlayerItem.Status) {
    if status == .failed {
      self.status = .error
      return
    }
    
    switch status {
    case .unknown:
      self.status = .loading
    case .readyToPlay:
      self.status = playerItem?.isPlaybackBufferEmpty == true ? .loading : .readytoplay
    case .failed:
      self.status = .error
    @unknown default:
      break
    }
    
    if self.status == .error || self.status == .readytoplay {
      guard let playerItem else {
        // unlikely to happen
        return
      }
      
      let height = playerItem.presentationSize.height
      let width = playerItem.presentationSize.width
      let orientation: VideoOrientation = playerItem.asset.tracks.first(where: { $0.mediaType == .video })?.orientation ?? .unknown
      
      eventEmitter.onLoad(
        .init(currentTime, duration, height, width, orientation)
      )
    }
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
}
