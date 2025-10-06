//
//  HybridVideoPlayerSourceFactory.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation

class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec {
  func fromVideoConfig(config: NativeVideoConfig) throws
    -> any HybridVideoPlayerSourceSpec
  {
    return try HybridVideoPlayerSource(config: config)
  }

  func fromUri(uri: String) throws -> HybridVideoPlayerSourceSpec {
    let config = NativeVideoConfig(
      uri: uri,
      externalSubtitles: nil,
      drm: nil,
      headers: nil,
      bufferConfig: nil,
      metadata: nil,
      initializeOnCreation: true
    )
    return try HybridVideoPlayerSource(config: config)
  }
}
