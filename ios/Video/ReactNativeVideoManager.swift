//
//  ReactNativeVideoManager.swift
//  react-native-video
//

import Foundation

public class ReactNativeVideoManager: RNVPlugin {
    private let expectedMaxVideoCount = 2

    // create a private initializer
    private init() {}

    public static let shared: ReactNativeVideoManager = .init()

    private var instanceCount = 0
    private var pluginList: [RNVPlugin] = Array()
    private var customDRMManager: DRMManagerSpec.Type?

    /**
     * register a new view
     */
    func registerView(newInstance _: RCTVideo) {
        if instanceCount > expectedMaxVideoCount {
            DebugLog("multiple Video displayed ?")
        }
        instanceCount += 1
    }

    /**
     * unregister existing view
     */
    func unregisterView(newInstance _: RCTVideo) {
        instanceCount -= 1
    }

    /**
     * register a new plugin in the managed list
     */
    public func registerPlugin(plugin: RNVPlugin) {
        pluginList.append(plugin)

        // Check if plugin provides DRM manager
        if let drmManager = plugin.getDRMManager() {
            if customDRMManager != nil {
                DebugLog("Multiple DRM managers registered. This is not supported. Using first registered manager.")
                return
            }
            customDRMManager = drmManager
        }
    }

    public func onInstanceCreated(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceCreated(id: id, player: player) }
    }

    public func onInstanceRemoved(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceRemoved(id: id, player: player) }
    }

    public func getDRMManager() -> DRMManagerSpec.Type? {
        return nil
    }

    /**
     * Creates a DRM manager instance
     * If a custom DRM manager is registered through a plugin, it will be used
     * Otherwise, the default DRMManager will be used
     */
    func createDRMManager() -> DRMManagerSpec {
        if let customManager = customDRMManager {
            return customManager.init()
        }
        return DRMManager()
    }
}
