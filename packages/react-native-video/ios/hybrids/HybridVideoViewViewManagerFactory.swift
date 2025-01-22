//
//  HybridVideoViewViewManagerFactory.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation

class HybridVideoViewViewManagerFactory: HybridVideoViewViewManagerFactorySpec {
  func createViewManager(nitroId: Double) throws -> any HybridVideoViewViewManagerSpec {
    return try HybridVideoViewViewManager(nitroId: nitroId)
  }
}
