//
//  PluginRegistry.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 22/07/2025.
//

import Foundation
import AVFoundation

public class Weak<T> {
  private weak var _value: AnyObject?
  public var value: T? {
    return _value as? T
  }

  public init(value: T) {
    _value = value as AnyObject
  }
}

public final class PluginsRegistry {
  public static let shared = PluginsRegistry()
  
  private var plugins = NSHashTable<ReactNativeVideoPlugin>.weakObjects()
  
  // TODO: Replace `Any` with a specific DRM manager type when created
  private var drmManager: Any? = nil
  
  // MARK: - Public API
  
  public func register(plugin: ReactNativeVideoPlugin) {
    plugins.add(plugin)
  }
  
  public func unregister(plugin: ReactNativeVideoPlugin) {
    plugins.remove(plugin)
  }
  
  public func setDRMManager(_ manager: Any?) throws {
    if drmManager != nil {
      throw PluginError.drmManagerAlreadyRegistered.error()
    }
    
    drmManager = manager
  }
  // MARK: - Internal API
  
  internal func getDrmManager() -> Any? {
    return drmManager
  }
  
  internal func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
    var overriddenSource = source
    
    for plugin in plugins.allObjects {
      overriddenSource = await plugin.overrideSource(source: source)
    }
    
    return overriddenSource
  }
  
  // MARK: - Notifications
  
  internal func notifyPlayerCreated(player: NativeVideoPlayer) {
    for plugin in plugins.allObjects {
      plugin.onPlayerCreated(player: Weak(value: player))
    }
  }
  
  internal func notifyPlayerDestroyed(player: NativeVideoPlayer) {
    for plugin in plugins.allObjects {
      plugin.onPlayerDestroyed(player: Weak(value: player))
    }
  }
  
  internal func notifyVideoViewCreated(view: VideoComponentView) {
    for plugin in plugins.allObjects {
      plugin.onVideoViewCreated(view: Weak(value: view))
    }
  }
  
  internal func notifyVideoViewDestroyed(view: VideoComponentView) {
    for plugin in plugins.allObjects {
      plugin.onVideoViewDestroyed(view: Weak(value: view))
    }
  }
}
