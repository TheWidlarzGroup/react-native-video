//
//  VideoPlayerObserver.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 15/04/2025.
//

import Foundation
import AVFoundation

protocol VideoPlayerObserverDelegate: AnyObject {
  func onPlayedToEnd(player: AVPlayer)
  func onPlayerItemChange(player: AVPlayer, playerItem: AVPlayerItem?)
  func onPlayerItemWillChange(hasNewPlayerItem: Bool)
  func onTextTrackDataChanged(texts: [NSAttributedString])
  func onTimedMetadataChanged(timedMetadata: [AVMetadataItem])
  func onRateChanged(rate: Float)
  func onPlaybackBufferEmpty()
  func onPlaybackLikelyToKeepUp()
  func onVolumeChanged(volume: Float)
  func onExternalPlaybackActiveChanged(isActive: Bool)
  func onTimeControlStatusChanged(status: AVPlayer.TimeControlStatus)
  func onPlayerStatusChanged(status: AVPlayer.Status)
  func onPlayerItemStatusChanged(status: AVPlayerItem.Status)
  func onBandwidthUpdate(bitrate: Double)
  func onProgressUpdate(currentTime: Double, bufferDuration: Double)
}

extension VideoPlayerObserverDelegate {
  func onPlayedToEnd(player: AVPlayer) {}
  func onPlayerItemChange(player: AVPlayer, playerItem: AVPlayerItem?) {}
  func onPlayerItemWillChange(hasNewPlayerItem: Bool) {}
  func onTextTrackDataChanged(texts: [NSAttributedString]) {}
  func onTimedMetadataChanged(timedMetadata: [AVMetadataItem]) {}
  func onRateChanged(rate: Float) {}
  func onPlaybackBufferEmpty() {}
  func onPlaybackLikelyToKeepUp() {}
  func onVolumeChanged(volume: Float) {}
  func onExternalPlaybackActiveChanged(isActive: Bool) {}
  func onTimeControlStatusChanged(status: AVPlayer.TimeControlStatus) {}
  func onPlayerStatusChanged(status: AVPlayer.Status) {}
  func onPlayerItemStatusChanged(status: AVPlayerItem.Status) {}
  func onBandwidthUpdate(bitrate: Double) {}
  func onProgressUpdate(currentTime: Double, bufferDuration: Double) {}
}

class VideoPlayerObserver: NSObject, AVPlayerItemMetadataOutputPushDelegate, AVPlayerItemLegibleOutputPushDelegate {
  private weak var delegate: HybridVideoPlayer?
  var player: AVPlayer? {
    delegate?.player
  }
  
  // Player observers
  var playerCurrentItemObserver: NSKeyValueObservation?
  var playerRateObserver: NSKeyValueObservation?
  var playerTimeControlStatusObserver: NSKeyValueObservation?
  var playerExternalPlaybackActiveObserver: NSKeyValueObservation?
  var playerVolumeObserver: NSKeyValueObservation?
  var playerTimedMetadataObserver: NSKeyValueObservation?
  var playerStatusObserver: NSKeyValueObservation?
  var playerProgressPeriodicObserver: Any?
  
  // Player item observers
  var playbackEndedObserver: NSObjectProtocol?
  var playbackBufferEmptyObserver: NSKeyValueObservation?
  var playbackLikelyToKeepUpObserver: NSKeyValueObservation?
  var playbackBufferFullObserver: NSKeyValueObservation?
  var playerItemStatusObserver: NSKeyValueObservation?
  var playerItemAccessLogObserver: NSObjectProtocol?
  
  var metadataOutput: AVPlayerItemMetadataOutput?
  var legibleOutput: AVPlayerItemLegibleOutput?
  
  init(delegate: HybridVideoPlayer) {
    self.delegate = delegate
  }
  
  deinit {
    invalidatePlayerObservers()
    invalidatePlayerItemObservers()
  }
  
  public func updatePlayerObservers() {
    invalidatePlayerItemObservers()
    invalidatePlayerObservers()
    
    initializePlayerObservers()
  }
  
  func initializePlayerObservers() {
    guard let player else {
      return
    }
    
    playerCurrentItemObserver = player.observe(\.currentItem, options: [.new, .old]) { [weak self] _, change in
      self?.onPlayerCurrentItemChanged(player: player, change: change)
    }
    
    playerRateObserver = player.observe(\.rate, options: [.new]) { [weak self] _, change in
      guard let rate = change.newValue else { return }
      self?.delegate?.onRateChanged(rate: rate)
    }
    
    playerTimeControlStatusObserver = player.observe(\.timeControlStatus, options: [.new]) { [weak self] _, change in
      guard let status = change.newValue else { return }
      self?.delegate?.onTimeControlStatusChanged(status: status)
    }
    
    playerExternalPlaybackActiveObserver = player.observe(\.isExternalPlaybackActive, options: [.new]) { [weak self] _, change in
      guard let isActive = change.newValue else { return }
      self?.delegate?.onExternalPlaybackActiveChanged(isActive: isActive)
    }
    
    playerVolumeObserver = player.observe(\.volume, options: [.new]) { [weak self] _, change in
      guard let volume = change.newValue else { return }
      self?.delegate?.onVolumeChanged(volume: volume)
    }
    
    playerStatusObserver = player.observe(\.status, options: [.new]) { [weak self] _, change in
      guard let status = change.newValue else { return }
      self?.delegate?.onPlayerStatusChanged(status: status)
    }
    
    // 500ms interval TODO: Make this configurable
    let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
    playerProgressPeriodicObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] _ in
      guard let self, let player = self.player, let delegate = self.delegate else { return }
      
      delegate.onProgressUpdate(currentTime: player.currentTime().seconds, bufferDuration: player.currentItem?.getbufferDuration() ?? 0)
    }
  }
  
  private func initializePlayerItemObservers(player: AVPlayer, playerItem: AVPlayerItem) {
    playbackEndedObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: playerItem,
      queue: nil
    ) { [weak self] notification in
      self?.delegate?.onPlayedToEnd(player: player)
    }
    
    playerItemAccessLogObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemNewAccessLogEntry,
      object: playerItem,
      queue: nil
    ) { [weak self] notification in
      self?.onPlayerAccessLog(playerItem: playerItem)
    }
    
    setupBufferObservers(for: playerItem)
    
    playerItemStatusObserver = playerItem.observe(\.status, options: [.new]) { [weak self] _, change in
      self?.delegate?.onPlayerItemStatusChanged(status: playerItem.status)
    }
    
    let metadataOutput = AVPlayerItemMetadataOutput()
    playerItem.add(metadataOutput)
    metadataOutput.setDelegate(self, queue: .global(qos: .userInteractive))
    
    let legibleOutput = AVPlayerItemLegibleOutput()
    playerItem.add(legibleOutput)
    metadataOutput.setDelegate(self, queue: .global(qos: .userInteractive))
  }
  
  private func invalidatePlayerItemObservers() {
    // Remove NotificationCenter observers
    if let playbackEndedObserver = playbackEndedObserver {
      NotificationCenter.default.removeObserver(playbackEndedObserver)
      self.playbackEndedObserver = nil
    }
    if let playerItemAccessLogObserver = playerItemAccessLogObserver {
      NotificationCenter.default.removeObserver(playerItemAccessLogObserver)
      self.playerItemAccessLogObserver = nil
    }
    // Invalidate KVO observers
    clearBufferObservers()
    playerItemStatusObserver?.invalidate()
    playerItemStatusObserver = nil
    // Remove outputs if needed
    // (Assumes outputs are not shared between items)
    if let playerItem = player?.currentItem {
      if let metadataOutput = metadataOutput {
        playerItem.remove(metadataOutput)
      }
      if let legibleOutput = legibleOutput {
        playerItem.remove(legibleOutput)
      }
    }
    metadataOutput = nil
    legibleOutput = nil
  }
  
  func invalidatePlayerObservers() {
    // Invalidate KVO observers
    playerCurrentItemObserver?.invalidate()
    playerCurrentItemObserver = nil
    playerRateObserver?.invalidate()
    playerRateObserver = nil
    playerTimeControlStatusObserver?.invalidate()
    playerTimeControlStatusObserver = nil
    playerExternalPlaybackActiveObserver?.invalidate()
    playerExternalPlaybackActiveObserver = nil
    playerVolumeObserver?.invalidate()
    playerVolumeObserver = nil
    playerStatusObserver?.invalidate()
    playerStatusObserver = nil
    // Remove periodic time observer from player
    if let player = player, let periodicObserver = playerProgressPeriodicObserver {
      player.removeTimeObserver(periodicObserver)
      playerProgressPeriodicObserver = nil
    }
  }
  
  // MARK: - AVPlayerItemLegibleOutputPushDelegate
  public func legibleOutput(_: AVPlayerItemLegibleOutput,
                     didOutputAttributedStrings strings: [NSAttributedString],
                     nativeSampleBuffers _: [Any],
                     forItemTime _: CMTime) {
    delegate?.onTextTrackDataChanged(texts: strings)
  }
  
  // MARK: - AVPlayerItemMetadataOutputPushDelegate
  public func metadataOutput(_: AVPlayerItemMetadataOutput, didOutputTimedMetadataGroups groups: [AVTimedMetadataGroup], from _: AVPlayerItemTrack?) {
    for metadataGroup in groups {
      delegate?.onTimedMetadataChanged(timedMetadata: metadataGroup.items)
    }
  }
  
  // MARK: - AVPlayer Observers
  func onPlayerCurrentItemChanged(player: AVPlayer, change: NSKeyValueObservedChange<AVPlayerItem?>) {
    let newPlayerItem = change.newValue?.flatMap { $0 }
    
    // Remove observers for old player item
    invalidatePlayerItemObservers()
    
    // Notify delegate about player item state change
    delegate?.onPlayerItemWillChange(hasNewPlayerItem: newPlayerItem != nil)
    
    if let playerItem = newPlayerItem {
      // Initialize observers for new player item
      initializePlayerItemObservers(player: player, playerItem: playerItem)
      
      delegate?.onPlayerItemChange(player: player, playerItem: playerItem)
    }
  }
  
  // MARK: - AVPlayerItem Observers
  func onPlayerAccessLog(playerItem: AVPlayerItem) {
    guard let accessLog = playerItem.accessLog() else { return }
    guard let lastEvent = accessLog.events.last else { return }
    
    delegate?.onBandwidthUpdate(bitrate: lastEvent.indicatedBitrate)
  }
  
  // MARK: - Buffer State Management
  
  func setupBufferObservers(for playerItem: AVPlayerItem) {
    clearBufferObservers()
    
    // Observe buffer empty - this indicates definite buffering
    playbackBufferEmptyObserver = playerItem.observe(\.isPlaybackBufferEmpty, options: [.new, .initial]) { [weak self] playerItem, change in
      let isEmpty = change.newValue ?? playerItem.isPlaybackBufferEmpty
      if isEmpty {
        self?.delegate?.onPlaybackBufferEmpty()
      }
    }
    
    // Observe likely to keep up - this indicates that buffering has finished
    playbackLikelyToKeepUpObserver = playerItem.observe(\.isPlaybackLikelyToKeepUp, options: [.new, .initial]) { [weak self] playerItem, change in
      let isLikelyToKeepUp = change.newValue ?? playerItem.isPlaybackLikelyToKeepUp
      if isLikelyToKeepUp {
        self?.delegate?.onPlaybackLikelyToKeepUp()
      }
    }
    
    // Observe buffer full as an additional signal
    playbackBufferFullObserver = playerItem.observe(\.isPlaybackBufferFull, options: [.new, .initial]) { [weak self] playerItem, change in
      let isFull = change.newValue ?? playerItem.isPlaybackBufferFull
      if isFull {
        self?.delegate?.onPlaybackLikelyToKeepUp()
      }
    }
  }
  
  func clearBufferObservers() {
    playbackBufferEmptyObserver?.invalidate()
    playbackBufferFullObserver?.invalidate()
    playbackLikelyToKeepUpObserver?.invalidate()
    
    playbackBufferEmptyObserver = nil
    playbackBufferFullObserver = nil
    playbackLikelyToKeepUpObserver = nil
  }
}
