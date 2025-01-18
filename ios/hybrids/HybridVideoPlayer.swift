//
//  HybridVideoPlayer.swift
//  NitroVideo
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
  private var _player: AVPlayer?
  
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
        if _player != nil && playerItem != nil {
          return _player!
        }
        
        do {
          let item = try initializePlayerItem()
          _player?.replaceCurrentItem(with: item)
          playerItem = item
          _player = AVPlayer(playerItem: playerItem)
        } catch {
          playerItem = nil
          _player = AVPlayer()
        }
        
        return _player!
      }
    }
    set {
      playerQueue.sync {
        _player = newValue
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
  
  func preload() throws -> NitroModules.Promise<Void> {
    return Promise.parallel { [weak self] in
      guard let self else {
        throw RuntimeError.error(withMessage: "HybridVideoPlayer has been deallocated")
      }
      
      try self.playerQueue.sync {
        self.playerItem = try self.initializePlayerItem()
        self._player = AVPlayer(playerItem: self.playerItem)
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
          
          guard let player = self._player else {
            throw RuntimeError.error(withMessage: "Player not initialized")
          }
          
          player.replaceCurrentItem(with: self.playerItem)
        } catch {
          self.playerItem = nil
          self._player = AVPlayer()
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
}
