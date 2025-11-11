//
//  HybridVideoViewViewManager.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import AVKit
import NitroModules

class HybridVideoViewViewManager: HybridVideoViewViewManagerSpec {
  weak var view: VideoComponentView?
  
  let DEALOCATED_WARNING = "ReactNativeVideo: VideoComponentView is no longer available. It is likely that the view was deallocated."
  
  init(nitroId: Double) throws {
    guard let view = VideoComponentView.globalViewsMap.object(forKey: NSNumber(value: nitroId)) else {
      throw VideoViewError.viewNotFound(nitroId: nitroId).error()
    }
    
    self.view = view
    super.init()
    view.delegate = VideoViewDelegate(viewManager: self)
  }
  
  // MARK: - Properties
  
  weak var player: (any HybridVideoPlayerSpec)? {
    get {
      guard let view = view else {
        print(DEALOCATED_WARNING)
        return nil
      }
      return view.player
    }
    set {
      guard let view = view else {
        print(DEALOCATED_WARNING)
        return
      }
      view.player = newValue
    }
  }
  
  var controls: Bool {
    get {
      guard let view else {
        print(DEALOCATED_WARNING)
        return false
      }
      
      return view.controls
    }
    set {
      guard let view else {
        print(DEALOCATED_WARNING)
        return
      }
      
      view.controls = newValue
    }
  }
  
  var pictureInPicture: Bool {
    get {
      guard let view else {
        print(DEALOCATED_WARNING)
        return false
      }
      
      return view.allowsPictureInPicturePlayback
    }
    set {
      guard let view else {
        print(DEALOCATED_WARNING)
        return
      }
      
      view.allowsPictureInPicturePlayback = newValue
    }
  }
  
  var autoEnterPictureInPicture: Bool {
    get {
      guard let view else {
        print(DEALOCATED_WARNING)
        return false
      }
      
      return view.autoEnterPictureInPicture
    }
    set {
      guard let view else {
        print(DEALOCATED_WARNING)
        return
      }
      
      view.autoEnterPictureInPicture = newValue
    }
  }
  
  var resizeMode: ResizeMode {
    get {
      guard let view else {
        print(DEALOCATED_WARNING)
        return .none
      }
      
      return view.resizeMode
    }
    set {
      guard let view else {
        print(DEALOCATED_WARNING)
        return
      }
      
      view.resizeMode = newValue
    }
  }
  
  var keepScreenAwake: Bool {
    get {
      guard let view else {
        print(DEALOCATED_WARNING)
        return false
      }
      
      return view.keepScreenAwake
    }
    set {
      guard let view else {
        print(DEALOCATED_WARNING)
        return
      }
      
      view.keepScreenAwake = newValue
    }
  }
  
  // Android only - no-op on iOS
  var surfaceType: SurfaceType = .surface
  
  func enterFullscreen() throws {
    guard let view else {
      throw VideoViewError.viewIsDeallocated.error()
    }
    
    try view.enterFullscreen()
  }
  
  func exitFullscreen() throws {
    guard let view else {
      throw VideoViewError.viewIsDeallocated.error()
    }
    
    try view.exitFullscreen()
  }
  
  func enterPictureInPicture() throws {
    guard let view else {
      throw VideoViewError.viewIsDeallocated.error()
    }
    
    try view.startPictureInPicture()
  }
  
  func exitPictureInPicture() throws {
    guard let view else {
      throw VideoViewError.viewIsDeallocated.error()
    }
    
    try view.stopPictureInPicture()
  }
  
  func canEnterPictureInPicture() -> Bool {
    return AVPictureInPictureController.isPictureInPictureSupported()
  }
  
  // MARK: - Callbacks
  
  var onPictureInPictureChange: ((Bool) -> Void)?
  
  var onFullscreenChange: ((Bool) -> Void)?
  
  var willEnterFullscreen: (() -> Void)?
  
  var willExitFullscreen: (() -> Void)?
  
  var willEnterPictureInPicture: (() -> Void)?
  
  var willExitPictureInPicture: (() -> Void)?
  
  var onReadyToDisplay: (() -> Void)?
}
