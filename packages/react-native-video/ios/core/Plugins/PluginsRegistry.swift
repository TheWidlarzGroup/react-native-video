//
//  PluginRegistry.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 22/07/2025.
//

import AVFoundation
import Foundation

public final class PluginsRegistry {
  public static let shared = PluginsRegistry()

  // Plugin ID -> ReactNativeVideoPluginSpec. Guarded by `lock`: plugins register from the JS
  // thread while sources load off the main thread and players notify from the main thread.
  private var plugins: [String: ReactNativeVideoPluginSpec] = [:]
  private let lock = NSLock()

  /// The plugins at this moment. Callbacks run on this copy, outside the lock, so a plugin
  /// may register or unregister from inside one.
  private var registeredPlugins: [ReactNativeVideoPluginSpec] {
    lock.lock()
    defer { lock.unlock() }
    return Array(plugins.values)
  }

  // MARK: - Public API

  public func register(plugin: ReactNativeVideoPluginSpec) {
    #if DEBUG
      if hasPlugin(plugin: plugin) {
        print(
          "[ReactNativeVideo] Plugin \(plugin.name) (ID: \(plugin.id)) is already registered - overwriting."
        )
      } else {
        print(
          "[ReactNativeVideo] Registering plugin \(plugin.name) (ID: \(plugin.id))."
        )
      }
    #endif

    lock.lock()
    plugins.updateValue(plugin, forKey: plugin.id)
    lock.unlock()
  }

  public func unregister(plugin: ReactNativeVideoPluginSpec) {
    #if DEBUG
      if !hasPlugin(plugin: plugin) {
        print(
          "[ReactNativeVideo] Plugin \(plugin.name) (ID: \(plugin.id)) is not registered - skipping."
        )
      } else {
        print("[ReactNativeVideo] Unregistering plugin \(plugin.name) (ID: \(plugin.id)).")
      }
    #endif

    lock.lock()
    plugins.removeValue(forKey: plugin.id)
    lock.unlock()
  }

  // MARK: - Internal API

  private func hasPlugin(plugin: ReactNativeVideoPluginSpec) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return plugins.contains { $0.value.id == plugin.id }
  }

  internal func getDrmManager(source: NativeVideoPlayerSource) throws -> DRMManagerSpec? {
    for plugin in registeredPlugins {
      if let drmManager = plugin.getDRMManager(source: source) {
        return drmManager
      }
    }

    throw LibraryError.DRMPluginNotFound.error()
  }

  internal func overrideSource(source: NativeVideoPlayerSource) async
    -> NativeVideoPlayerSource
  {
    var overriddenSource = source

    for plugin in registeredPlugins {
      overriddenSource = await plugin.overrideSource(source: overriddenSource)
    }

    return overriddenSource
  }

  // MARK: - Notifications

  internal func notifyPlayerCreated(player: NativeVideoPlayer) {
    for plugin in registeredPlugins {
      plugin.onPlayerCreated(player: Weak(value: player))
    }
  }

  internal func notifyPlayerDestroyed(player: NativeVideoPlayer) {
    for plugin in registeredPlugins {
      plugin.onPlayerDestroyed(player: Weak(value: player))
    }
  }

  /// For a player that is being deinitialized and can no longer be referenced.
  internal func notifyPlayerDestroyed(_ player: Weak<NativeVideoPlayer>) {
    for plugin in registeredPlugins {
      plugin.onPlayerDestroyed(player: player)
    }
  }

  internal func notifyVideoViewCreated(view: VideoComponentView) {
    for plugin in registeredPlugins {
      plugin.onVideoViewCreated(view: Weak(value: view))
    }
  }

  internal func notifyVideoViewDestroyed(view: VideoComponentView) {
    for plugin in registeredPlugins {
      plugin.onVideoViewDestroyed(view: Weak(value: view))
    }
  }
}
