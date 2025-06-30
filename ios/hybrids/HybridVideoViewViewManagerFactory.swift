//
//  HybridVideoViewViewManagerFactory.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation

class HybridVideoViewViewManagerFactory: HybridVideoViewViewManagerFactorySpec {
  func createViewManager(nitroId: Double) throws -> any HybridVideoViewViewManagerSpec {
    return try HybridVideoViewViewManager(nitroId: nitroId)
  }
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
