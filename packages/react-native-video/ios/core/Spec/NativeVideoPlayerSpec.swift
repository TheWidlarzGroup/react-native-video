//
//  NativeVideoPlayerSpec.swift
//  react-native-video
//
// Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import AVFoundation

// Helper alias that allow to represet player outside of module
public typealias NativeVideoPlayer = NativeVideoPlayerSpec & HybridVideoPlayerSpec

public protocol NativeVideoPlayerSpec {
  // MARK: - Properties
  
  /// The underlying AVPlayer instance (should not be used directly)
  var player: AVPlayer { get set }
  
  /// The current player item
  var playerItem: AVPlayerItem? { get set }
  
  /// The player observer for monitoring state changes
  // var playerObserver: VideoPlayerObserver? { get set }
  
  /// Whether the player was auto-paused
  var wasAutoPaused: Bool { get set }
  
  /// Whether the player is currently buffering
  var isCurrentlyBuffering: Bool { get set }
  
  /// The memory size used by the player
  var memorySize: Int { get }
  
  // MARK: - Methods
  
  /// Release the player resources
  func release()
  
  /// Initialize the player item asynchronously
  func initializePlayerItem() async throws -> AVPlayerItem
}
