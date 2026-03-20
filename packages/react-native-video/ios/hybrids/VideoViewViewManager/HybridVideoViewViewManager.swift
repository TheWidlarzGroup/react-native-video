//
//  HybridVideoViewViewManager.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import AVKit
import NitroModules

struct ViewListenerPair {
  let id: UUID
  let eventName: String
  let callback: Any
}

class HybridVideoViewViewManager: HybridVideoViewViewManagerSpec {
  weak var view: VideoComponentView?
  var listeners: [ViewListenerPair] = []
  
  let DEALOCATED_WARNING = "ReactNativeVideo: VideoComponentView is no longer available. It is likely that the view was deallocated."
  
  init(nitroId: Double) throws {
    guard let view = VideoComponentView.globalViewsMap.object(forKey: NSNumber(value: nitroId)) else {
      throw VideoViewError.viewNotFound(nitroId: nitroId).error()
    }
    
    self.view = view
    super.init()
    view.delegate = VideoViewDelegate(viewManager: self)
  }
  
  // MARK: - Private helpers
  
  private func addListener<T>(eventName: String, listener: T) -> ListenerSubscription {
    let id = UUID()
    listeners.append(ViewListenerPair(id: id, eventName: eventName, callback: listener))
    return ListenerSubscription(remove: { [weak self] in
      self?.listeners.removeAll { $0.id == id }
    })
  }
  
  private func emitEvent<T>(eventName: String, invoke: (T) throws -> Void) {
    for pair in listeners where pair.eventName == eventName {
      if let callback = pair.callback as? T {
        do {
          try invoke(callback)
        } catch {
          print("[ReactNativeVideo] Error calling \(eventName) listener: \(error)")
        }
      } else {
        print("[ReactNativeVideo] Invalid callback type for \(eventName)")
      }
    }
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
  
  // MARK: - Listener registration methods
  
  func addOnPictureInPictureChangeListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onPictureInPictureChange", listener: listener)
  }
  
  func addOnFullscreenChangeListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onFullscreenChange", listener: listener)
  }
  
  func addWillEnterFullscreenListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "willEnterFullscreen", listener: listener)
  }
  
  func addWillExitFullscreenListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "willExitFullscreen", listener: listener)
  }
  
  func addWillEnterPictureInPictureListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "willEnterPictureInPicture", listener: listener)
  }
  
  func addWillExitPictureInPictureListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "willExitPictureInPicture", listener: listener)
  }
  
  func clearAllListeners() throws {
    listeners.removeAll()
  }
  
  // MARK: - Event emission methods
  
  func onPictureInPictureChange(_ isActive: Bool) {
    emitEvent(eventName: "onPictureInPictureChange") { (callback: (Bool) throws -> Void) in try callback(isActive) }
  }
  
  func onFullscreenChange(_ isActive: Bool) {
    emitEvent(eventName: "onFullscreenChange") { (callback: (Bool) throws -> Void) in try callback(isActive) }
  }
  
  func willEnterFullscreen() {
    emitEvent(eventName: "willEnterFullscreen") { (callback: () throws -> Void) in try callback() }
  }
  
  func willExitFullscreen() {
    emitEvent(eventName: "willExitFullscreen") { (callback: () throws -> Void) in try callback() }
  }
  
  func willEnterPictureInPicture() {
    emitEvent(eventName: "willEnterPictureInPicture") { (callback: () throws -> Void) in try callback() }
  }
  
  func willExitPictureInPicture() {
    emitEvent(eventName: "willExitPictureInPicture") { (callback: () throws -> Void) in try callback() }
  }
}
