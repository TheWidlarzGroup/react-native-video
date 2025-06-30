//
//  HybridVideoViewViewManager.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import NitroModules

class HybridVideoViewViewManager: HybridVideoViewViewManagerSpec {
  var player: (any HybridVideoPlayerSpec)? {
    get {
      view.player
    }
    set {
      view.player = newValue
    }
  }
  
  let view: VideoComponentView
  
  init(nitroId: Double) throws {
    guard let view = VideoComponentView.globalViewsMap.object(forKey: NSNumber(value: nitroId)) else {
      throw RuntimeError.error(withMessage: "No view found for \(nitroId)")
    }
    
    self.view = view
  }
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
