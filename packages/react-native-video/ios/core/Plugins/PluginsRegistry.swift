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

  // Plugin ID -> ReactNativeVideoPluginSpec
  private var plugins: [String: ReactNativeVideoPluginSpec] = [:]

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

    plugins.updateValue(plugin, forKey: plugin.id)
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

    plugins.removeValue(forKey: plugin.id)
  }

  // MARK: - Internal API

  private func hasPlugin(plugin: ReactNativeVideoPluginSpec) -> Bool {
    return plugins.contains { $0.value.id == plugin.id }
  }

  internal func getDrmManager(source: NativeVideoPlayerSource) throws -> DRMManagerSpec? {
    for plugin in plugins.values {
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

    for plugin in plugins.values {
      overriddenSource = await plugin.overrideSource(source: overriddenSource)
    }

    return overriddenSource
  }

  // MARK: - Notifications

  internal func notifyPlayerCreated(player: NativeVideoPlayer) {
    for plugin in plugins.values {
      plugin.onPlayerCreated(player: Weak(value: player))
    }
  }

  internal func notifyPlayerDestroyed(player: NativeVideoPlayer) {
    for plugin in plugins.values {
      plugin.onPlayerDestroyed(player: Weak(value: player))
    }
  }

  internal func notifyVideoViewCreated(view: VideoComponentView) {
    for plugin in plugins.values {
      plugin.onVideoViewCreated(view: Weak(value: view))
    }
  }

  internal func notifyVideoViewDestroyed(view: VideoComponentView) {
    for plugin in plugins.values {
      plugin.onVideoViewDestroyed(view: Weak(value: view))
    }
  }
}
