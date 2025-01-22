//
//  HybridVideoPlayerSourceFactory.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation

class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec {
  func fromUri(uri: String) throws -> HybridVideoPlayerSourceSpec {
    return try HybridVideoPlayerSource(uri: uri)
  }
}
