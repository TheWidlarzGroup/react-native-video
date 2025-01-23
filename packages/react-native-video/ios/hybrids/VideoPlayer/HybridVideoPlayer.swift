//
//  HybridVideoPlayer.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import NitroModules
import AVFoundation

class HybridVideoPlayer: HybridVideoPlayerSpec {
  /**
   * This in general should not be used directly, use `playerPointer` instead. This should be set only from within the playerQueue.
   */
  private var player: AVPlayer?
  
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
          player?.replaceCurrentItem(with: item)
          playerItem = item
          player = AVPlayer(playerItem: playerItem)
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
  
  var source: any HybridVideoPlayerSourceSpec
  
  var volume: Double {
    set {
      playerPointer.volume = Float(newValue)
    }
    get {
      return Double(playerPointer.volume)
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
  
  init(source: (any HybridVideoPlayerSourceSpec)) throws {
    self.source = source
    super.init()
  }
  
  deinit {
    release()
  }
  
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
    }
  }
  
  func preload() throws -> NitroModules.Promise<Void> {
    return Promise.parallel { [weak self] in
      guard let self else {
        throw RuntimeError.error(withMessage: "HybridVideoPlayer has been deallocated")
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
  
  func replaceSourceAsync(source: (any HybridVideoPlayerSourceSpec)) throws -> Promise<Void> {
    return Promise.parallel { [weak self] in
      guard let self else {
        throw RuntimeError.error(withMessage: "HybridVideoPlayer has been deallocated")
      }
      
      try playerQueue.sync {
        self.source = source
        
        do {
          self.playerItem = try self.initializePlayerItem()
          
          guard let player = self.player else {
            throw RuntimeError.error(withMessage: "Player not initialized")
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
  
  private func initializePlayerItem() throws -> AVPlayerItem {
    guard let _source = source as? HybridVideoPlayerSource else {
      throw RuntimeError.error(withMessage: "Invalid source")
    }
    
    try _source.initializeAsset()
    
    guard let asset = _source.asset else {
      throw RuntimeError.error(withMessage: "Failed to initialize asset")
    }
    
    return AVPlayerItem(asset: asset)
  }
  
  override var memorySize: Int {
    var size = 0
    
    size += source.memorySize
    size += playerItem?.asset.estimatedMemoryUsage ?? 0
    
    return size
  }
}
