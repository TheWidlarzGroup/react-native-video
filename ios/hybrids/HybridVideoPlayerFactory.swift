//
//  HybridVideoPlayerFactory.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import NitroModules

class HybridVideoPlayerFactory: HybridVideoPlayerFactorySpec {
  func createPlayer(source: HybridVideoPlayerSourceSpec) throws -> HybridVideoPlayerSpec {
    return try HybridVideoPlayer(source: source)
  }
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
