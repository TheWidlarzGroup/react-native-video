//
//  DRMPlugin.swift
//  ReactNativeVideoDrm
//
//  Created by Krzysztof Moch on 07/08/2025.
//

import Foundation
import ReactNativeVideo

class DRMPlugin: ReactNativeVideoPlugin {
  override func getDRMManager(source: any NativeVideoPlayerSource) -> (any DRMManagerSpec)? {
    #if targetEnvironment(simulator)
      // DRM is not supported on the simulator.
      print("[ReactNativeVideoDRM] DRM is not supported on the simulator. Returning nil.")
      return nil
    #else
      return DRMManager(source: source)
    #endif
  }
}
