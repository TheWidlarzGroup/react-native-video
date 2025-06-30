//
//  HybridVideoPlayerSourceFactory.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation

class HybridVideoPlayerSourceFactory: HybridVideoPlayerSourceFactorySpec {
  func fromUri(uri: String) -> HybridVideoPlayerSourceSpec {
    return HybridVideoPlayerSource(uri: uri)
  }
  
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
