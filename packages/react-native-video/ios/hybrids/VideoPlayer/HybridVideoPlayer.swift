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
  var player: AVPlayer? {
    didSet {
      playerObserver?.initializePlayerObservers()
    }
    willSet {
      playerObserver?.invalidatePlayerObservers()
    }
  }
  
  /**
   * The player queue is used to synchronize player initialization.
   */
  private let playerQueue =  DispatchQueue(label: "com.nitro.hybridplayer", qos: .userInitiated)
  
  /**
   * This is the actual player that should be used for playback. It is initialized lazily when `playerPointer` is accessed.
   */
  var playerPointer: AVPlayer {
    get {
      // Synchronize access to player instance
      playerQueue.sync {
        if player != nil && playerItem != nil {
          return player!
        }

        do {
          if self.playerItem == nil {
            self.playerItem = try initializePlayerItemSync()
          }
        
          if player == nil {
            player = AVPlayer()
          }
          
          player?.replaceCurrentItem(with: playerItem)
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
    self.eventEmitter = HybridVideoPlayerEventEmitter()
    
    super.init()
    self.playerObserver = VideoPlayerObserver(delegate: self)
    
    VideoManager.shared.register(player: self)
  }
  
  deinit {
    release()
  }
  
  // MARK: - Hybrid Impl
  
  var source: any HybridVideoPlayerSourceSpec
  
  var status: VideoPlayerStatus = .idle {
    didSet {
      if status != oldValue {
        eventEmitter.onStatusChange(status)
      }
    }
  }
  
  var eventEmitter: HybridVideoPlayerEventEmitterSpec
  
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
      eventEmitter.onSeek(newValue)
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

  var isPlaying: Bool {
    get {
      // we are using here player as we don't want to initialize it
      // player is initialized lazily when playerPointer is accessed
      return player?.rate != 0
    }
  }
  
  func clean() throws {
    release()
  }
  
  func release() {
    playerQueue.async { [weak self] in
      guard let self = self else { return }
      self.player?.replaceCurrentItem(with: nil)
      self.player = nil
      self.playerItem = nil
      
      if let source = self.source as? HybridVideoPlayerSource {
        source.releaseAsset()
      }
      
      // Clear player observer
      self.playerObserver = nil
      status = .idle
    }
  }
  
  func preload() throws -> NitroModules.Promise<Void> {
    let promise = Promise<Void>()
    
    if status != .idle {
      promise.resolve(withResult: ())
      return promise
    }
    
    Task.detached(priority: .userInitiated) { [weak self] in
      guard let self else {
        promise.reject(withError: LibraryError.deallocated(objectName: "HybridVideoPlayer").error())
        return
      }
      
      do {
        let playerItem = try await self.initializePlayerItem()
        self.playerItem = playerItem
        
        self.playerQueue.sync {
          self.player = AVPlayer()
          self.player?.replaceCurrentItem(with: playerItem)
          promise.resolve(withResult: ())
        }
      } catch {
        promise.reject(withError: error)
      }
    }
    
    return promise
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
  
  func replaceSourceAsync(source: (any HybridVideoPlayerSourceSpec)?) throws -> Promise<Void> {
    let promise = Promise<Void>()
    
    guard let source else {
      release()
      promise.resolve(withResult: ())
      return promise
    }
    
    Task.detached(priority: .userInitiated) { [weak self] in
      guard let self else {
        promise.reject(withError: LibraryError.deallocated(objectName: "HybridVideoPlayer").error())
        return
      }
      
      self.playerItem = try await self.initializePlayerItem()
      self.source = source
      
      playerQueue.sync {
        do {
          guard let player = self.player else {
            throw PlayerError.notInitialized.error()
          }
          
          player.replaceCurrentItem(with: self.playerItem)
          promise.resolve(withResult: ())
        } catch {
          self.playerItem = nil
          self.player = AVPlayer()
          promise.reject(withError: error)
        }
      }
    }
    
    return promise
  }
  
  // MARK: - Internal Methods
  
  /**
    * Initialize the player item synchronously. This is used to initialize the player item before it is set to the player.
    * This is necessary because the player item is used to initialize the player.
    * This is a blocking call and should be used with caution. prefer using `initializePlayerItem()` instead.
    */
  private func initializePlayerItemSync() throws -> AVPlayerItem {
    let semaphore = DispatchSemaphore(value: 0)
    var initializedItem: AVPlayerItem?
    var initializationError: Error?

    Task.detached(priority: .userInitiated) { [weak self] in
      guard let strongSelf = self else {
        semaphore.signal()
        throw LibraryError.deallocated(objectName: "HybridVideoPlayer").error()
      }
      
      do {
        initializedItem = try await strongSelf.initializePlayerItem()
      } catch {
        initializationError = error
      }
      
      semaphore.signal()
    }
    
    semaphore.wait() // Block current thread (playerQueue)

    if let error = initializationError, initializedItem == nil {
      throw error
    }
  
    return initializedItem!
  }
  
  private func initializePlayerItem() async throws -> AVPlayerItem {
    guard let _source = source as? HybridVideoPlayerSource else {
      status = .error
      throw PlayerError.invalidSource.error()
    }
    
    let isNetowrkSource = _source.url.isFileURL == false
    eventEmitter.onLoadStart(.init(sourceType: isNetowrkSource ? .network : .local, source: _source))
    
    try await _source.initializeAsset()
    
    guard let asset = _source.asset else {
      status = .error
      throw SourceError.failedToInitializeAsset.error()
    }
    
    // iOS does not support external subtitles for HLS streams
    if let externalSubtiles = source.config.externalSubtitles, externalSubtiles.isEmpty == false, source.uri.hasSuffix(".m3u8") == false {
      return try await AVPlayerItem.withExternalSubtitles(for: asset, config: source.config)
    }
    
    return AVPlayerItem(asset: asset)
  }
  
  // MARK: - Memory Management
  
  var memorySize: Int {
    var size = 0
    
    size += source.memorySize
    size += playerItem?.asset.estimatedMemoryUsage ?? 0
    
    return size
  }
}
