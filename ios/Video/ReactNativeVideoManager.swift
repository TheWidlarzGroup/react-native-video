//
//  ReactNativeVideoManager.swift
//  react-native-video
//

import AVFoundation
import Foundation

public class ReactNativeVideoManager: RNVPlugin {
    private let expectedMaxVideoCount = 2

    public static let shared: ReactNativeVideoManager = .init()
    public var pluginName: String = "ReactNativeVideoManager"

    private var instanceCount = 0
    private var pluginList: Set<RNVPlugin> = Set()
    private var customDRMManager: (RNVPlugin, DRMManagerSpec)?

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
        pluginList.insert(plugin)

        maybeRegisterAVPlayerPlugin(plugin: plugin)
    }

    public func unregisterPlugin(plugin: RNVPlugin) {
        pluginList.remove(plugin)

        maybeUnregisterAVPlayerPlugin(plugin: plugin)
    }

    // MARK: - RNVPlugin methods

    override public func onInstanceCreated(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceCreated(id: id, player: player) }
    }

    override public func onInstanceRemoved(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceRemoved(id: id, player: player) }
    }

    // MARK: - RNV AVPlayer plugin specific methods

    /**
     * If a custom DRM manager is registered through a plugin, it will be used
     * Otherwise, the default DRMManager will be used
     */
    public func getDRMManager() -> DRMManagerSpec? {
        return customDRMManager?.1 ?? DRMManager()
    }

    public func overridePlayerAsset(source: VideoSource, asset: AVAsset) async -> OverridePlayerAssetResult? {
        for plugin in pluginList {
            if let avpPlugin = plugin as? RNVAVPlayerPlugin,
               let overridePlayerAsset = await avpPlugin.overridePlayerAsset(source: source, asset: asset) {
                return overridePlayerAsset
            }
        }

        return nil
    }

    // MARK: - Helper methods

    func maybeRegisterAVPlayerPlugin(plugin: RNVPlugin) {
        guard let avpPlugin = plugin as? RNVAVPlayerPlugin else {
            return
        }

        if let drmManager = avpPlugin.getDRMManager() {
            if customDRMManager != nil {
                DebugLog(
                    "Multiple DRM managers registered. This is not supported. Using first registered manager."
                )
                return
            }

            customDRMManager = (plugin, drmManager)
        }
    }

    func maybeUnregisterAVPlayerPlugin(plugin: RNVPlugin) {
        guard let avpPlugin = plugin as? RNVAVPlayerPlugin else {
            return
        }

        if customDRMManager?.0 == plugin {
            customDRMManager = nil
        }
    }
}
