//
//  HybridVideoPlayerFactory.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import NitroModules

class HybridVideoPlayerFactory: HybridVideoPlayerFactorySpec {
  func createPlayer(source: HybridVideoPlayerSourceSpec) throws -> HybridVideoPlayerSpec {
    return try HybridVideoPlayer(source: source)
  }
}
