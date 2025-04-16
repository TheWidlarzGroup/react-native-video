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
}

extension VideoPlayerObserverDelegate {
  func onPlayedToEnd(player: AVPlayer) {}
  func onPlayerItemChange(player: AVPlayer, playerItem: AVPlayerItem?) {}
}

class VideoPlayerObserver {
  private weak var delegate: HybridVideoPlayer?
  var player: AVPlayer? {
    delegate?.player
  }
  
  // Player observers
  var playerCurrentItemObserver: NSKeyValueObservation?
  
  // Player item observers
  var playbackEndedObserver: NSObjectProtocol?
  
  init(delegate: HybridVideoPlayer) {
    self.delegate = delegate
  }
  
  deinit {
    removeObservers()
    invalidatePlayerItemObservers()
  }
  
  public func updatePlayerObservers() {
    invalidatePlayerItemObservers()
    removeObservers()
    
    initializePlayerObservers()
  }
  
  private func initializePlayerObservers() {
    guard let player else {
      return
    }
    
    playerCurrentItemObserver = player.observe(\.currentItem, options: [.new, .old]) { [weak self] _, change in
      self?.onPlayerCurrentItemChanged(player: player, change: change)
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
  }
  
  private func invalidatePlayerItemObservers() {
    NotificationCenter.default.removeObserver(playbackEndedObserver as Any)
  }
    
  
  private func removeObservers() {
    playerCurrentItemObserver?.invalidate()
  }
  
  func onPlayerCurrentItemChanged(player: AVPlayer, change: NSKeyValueObservedChange<AVPlayerItem?>) {
    let newPlayerItem = change.newValue?.flatMap { $0 }
    
    // Remove observers for old player item
    invalidatePlayerItemObservers()
    
    if let playerItem = newPlayerItem {
      // Initialize observers for new player item
      initializePlayerItemObservers(player: player, playerItem: playerItem)
      
      delegate?.onPlayerItemChange(player: player, playerItem: playerItem)
    }
  }
}
