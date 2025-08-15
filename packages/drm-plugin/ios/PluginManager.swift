//
//  PluginManager.swift
//  ReactNativeVideoDrm
//
//  Created by Krzysztof Moch on 07/08/2025.
//

import NitroModules
import ReactNativeVideo

class PluginManager: HybridPluginManagerSpec {
  var plugin: DRMPlugin? = nil

  override init() {
    super.init()
    do {
      try enable()
    } catch {
      // Handle error if needed, for example log it
      print("Failed to enable DRM plugin: \(error)")
    }
  }

  var isEnabled: Bool {
    return plugin != nil
  }

  func enable() throws {
    if isEnabled {
      return
    }

    try initializePlugin()
  }

  func disable() throws {
    if !isEnabled {
      return
    }

    try destroyPlugin()
  }

  private func initializePlugin() throws {
    plugin = DRMPlugin(name: "ReactNativeVideoDRM")

    guard let plugin else {
      throw RuntimeError.error(withMessage: "Failed to initialize DRM plugin.")
    }

    PluginsRegistry.shared.register(plugin: plugin)
  }

  private func destroyPlugin() throws {
    guard let plugin else {
      throw RuntimeError.error(withMessage: "Plugin is not initialized.")
    }

    PluginsRegistry.shared.unregister(plugin: plugin)
    self.plugin = nil
  }

  func dispose() {
    if isEnabled {
      do {
        try destroyPlugin()
      } catch {
        // ignore errors during disposal
      }
    }
  }
}
