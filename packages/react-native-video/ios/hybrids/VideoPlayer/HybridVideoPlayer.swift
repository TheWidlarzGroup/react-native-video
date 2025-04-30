//
//  HybridVideoPlayer.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import NitroModules
import AVFoundation

class HybridVideoPlayer: HybridVideoPlayerSpec, VideoPlayerObserverDelegate {
  /**
   * This in general should not be used directly, use `playerPointer` instead. This should be set only from within the playerQueue.
   */
  var player: AVPlayer? {
    didSet {
      playerObserver?.updatePlayerObservers()
    }
  }
  
  /**
   * The player queue is used to synchronize player initialization.
   */
  private let playerQueue = DispatchQueue(label: "com.nitro.hybridplayer")
  
  /**
   * This is the actual player that should be used for playback. It is initialized lazily when `playerPointer` is accessed.
   */
  var playerPointer: AVPlayer {
    get {
      // Synchronize access to player initialization
      playerQueue.sync {
        // If player is already initialized and playerItem is set, return it
        // If playerItem is not set, it means that player was not loaded with any source
        if player != nil && playerItem != nil {
          return player!
        }
        
        do {
          let item = try initializePlayerItem()
          playerItem = item
          
          // We need to intialize empty player first so player observers are set
          // before we set the player item
          player = AVPlayer()
          player?.replaceCurrentItem(with: item)
        } catch {
          playerItem = nil
          player = AVPlayer()
        }
        
        return player!
      }
    }
    set {
      playerQueue.sync {
        player = newValue
      }
    }
  }
  
  var playerItem: AVPlayerItem?
  var playerObserver: VideoPlayerObserver?
  
  init(source: (any HybridVideoPlayerSourceSpec)) throws {
    self.source = source
    
    super.init()
    self.playerObserver = VideoPlayerObserver(delegate: self)
    
    VideoManager.shared.register(player: self)
  }
  
  deinit {
    release()
  }
  
  // MARK: - Hybrid Impl
  
  var source: any HybridVideoPlayerSourceSpec
  
  var volume: Double {
    set {
      playerPointer.volume = Float(newValue)
    }
    get {
      return Double(playerPointer.volume)
    }
  }
  
  var muted: Bool {
    set {
      playerPointer.isMuted = newValue
    }
    get {
      return playerPointer.isMuted
    }
  }
  
  var currentTime: Double {
    set {
      playerPointer.seek(
        to: CMTime(seconds: newValue, preferredTimescale: 1000),
        toleranceBefore: .zero,
        toleranceAfter: .zero
      )
    }
    get {
      playerPointer.currentTime().seconds
    }
  }
  
  var duration: Double {
    Double(playerPointer.currentItem?.duration.seconds ?? Double.nan)
  }
  
  var rate: Double {
    set {
      if #available(iOS 16.0, tvOS 16.0, *) {
        playerPointer.defaultRate = Float(newValue)
      }
      
      playerPointer.rate = Float(newValue)
    }
    get {
      return Double(playerPointer.rate)
    }
  }
  
  var loop: Bool = false
  
  func clean() throws {
    release()
  }
  
  func release() {
    playerQueue.sync { [weak self] in
      guard let self = self else { return }
      self.player?.replaceCurrentItem(with: nil)
      self.player = nil
      self.playerItem = nil
      
      if let source = self.source as? HybridVideoPlayerSource {
        source.releaseAsset()
      }
      
      // Clear player observer
      self.playerObserver = nil
    }
  }
  
  func preload() throws -> NitroModules.Promise<Void> {
    return Promise.parallel { [weak self] in
      guard let self else {
        throw LibraryError.deallocated(objectName: "HybridVideoPlayer").error()
      }
      
      try self.playerQueue.sync {
        self.playerItem = try self.initializePlayerItem()
        self.player = AVPlayer(playerItem: self.playerItem)
      }
    }
  }
  
  func play() throws {
    playerPointer.play()
  }
  
  func pause() throws {
    playerPointer.pause()
  }
  
  func seekBy(time: Double) throws {
    guard let currentItem = playerPointer.currentItem else {
      throw PlayerError.notInitialized.error()
    }
    
    let currentItemTime = currentItem.currentTime()
    
    // Duration is NaN for live streams
    let fixedDurration = duration.isNaN ? Double.infinity : duration
    
    // Clap by <0, duration>
    let newTime = max(0, min(currentItemTime.seconds + time, fixedDurration))
    
    currentTime = newTime
  }
  
  func seekTo(time: Double) {
    currentTime = time
  }
  
  func replaceSourceAsync(source: (any HybridVideoPlayerSourceSpec)) throws -> Promise<Void> {
    return Promise.parallel { [weak self] in
      guard let self else {
        throw LibraryError.deallocated(objectName: "HybridVideoPlayer").error()
      }
      
      try playerQueue.sync {
        self.source = source
        
        do {
          self.playerItem = try self.initializePlayerItem()
          
          guard let player = self.player else {
            throw PlayerError.notInitialized.error()
          }
          
          player.replaceCurrentItem(with: self.playerItem)
        } catch {
          self.playerItem = nil
          self.player = AVPlayer()
          throw error
        }
      }
    }
  }
  
  // MARK: - Internal Methods
  
  private func initializePlayerItem() throws -> AVPlayerItem {
    guard let _source = source as? HybridVideoPlayerSource else {
      throw PlayerError.invalidSource.error()
    }
    
    try _source.initializeAsset()
    
    guard let asset = _source.asset else {
      throw SourceError.failedToInitializeAsset.error()
    }
    
    return AVPlayerItem(asset: asset)
  }
  
  // MARK: - VideoPlayerObserverDelegate
  
  func onPlayedToEnd(player: AVPlayer) {
    // TODO: Notify listeners once we implement callbacks
    
    if loop {
      currentTime = 0
      try? play()
    }
  }
  
  // MARK: - Memory Management
  
  var memorySize: Int {
    var size = 0
    
    size += source.memorySize
    size += playerItem?.asset.estimatedMemoryUsage ?? 0
    
    return size
  }
}
