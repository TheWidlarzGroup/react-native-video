//
//  HybridVideoViewViewManager.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import NitroModules

class HybridVideoViewViewManager: HybridVideoViewViewManagerSpec {
  weak var view: VideoComponentView?
  
  weak var player: (any HybridVideoPlayerSpec)? {
    get {
      guard let view = view else {
        print("ReactNativeVideo: VideoComponentView is no longer available. It is likely that the view was deallocated.")
        return nil
      }
      return view.player
    }
    set {
      guard let view = view else {
        print("ReactNativeVideo: VideoComponentView is no longer available. It is likely that the view was deallocated.")
        return
      }
      view.player = newValue
    }
  }
  
  init(nitroId: Double) throws {
    guard let view = VideoComponentView.globalViewsMap.object(forKey: NSNumber(value: nitroId)) else {
      throw VideoViewError.viewNotFound(nitroId: nitroId).error()
    }
    
    self.view = view 
  }
}
