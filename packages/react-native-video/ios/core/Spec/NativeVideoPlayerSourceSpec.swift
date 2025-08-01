//
//  NativeVideoPlayerSourceSpec.swift
//  react-native-video
//
// Created by Krzysztof Moch on 23/07/2025.
//

import Foundation
import AVFoundation

// Helper alias that allow to represet player source outside of module
public typealias NativeVideoPlayerSource = NativeVideoPlayerSourceSpec & HybridVideoPlayerSourceSpec

public protocol NativeVideoPlayerSourceSpec {
  // MARK: - Properties
  
  /// The underlying AVURLAsset instance
  var asset: AVURLAsset? { get set }
  
  /// The URL of the video source
  var url: URL { get }
  
  /// The memory size used by the source
  var memorySize: Int { get }
  
  // MARK: - Methods
  
  /// Initialize the asset asynchronously
  func initializeAsset() async throws
  
  /// Get non-null AVURLAsset instance (self.asset)
  func getAsset() async throws -> AVURLAsset
  
  /// Release the asset resources
  func releaseAsset()
} 
