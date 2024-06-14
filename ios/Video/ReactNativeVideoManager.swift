//
//  ReactNativeVideoManager.swift
//  react-native-video
//

import Foundation

public class ReactNativeVideoManager: RNVAnalyticsPlugin {
    private let expectedMaxVideoCount = 10

    // create a private initializer
    private init() {}

    public static let shared: ReactNativeVideoManager = {
        let instance = ReactNativeVideoManager()
        // setup code
        return instance
    }()

    var instanceList: [RCTVideo] = Array()
    var analyticsPluginList: [RNVAnalyticsPlugin] = Array()

    /**
      * register a new ReactExoplayerViewManager in the managed list
     */
    func registerView(newInstance: RCTVideo) {
        if instanceList.count > expectedMaxVideoCount {
            DebugLog("multiple Video displayed ?")
        }
        instanceList.append(newInstance)
    }

    /**
     * unregister existing ReactExoplayerViewManager in the managed list
     */
    func unregisterView(newInstance: RCTVideo) {
        if let i = instanceList.firstIndex(of: newInstance) {
            instanceList.remove(at: i)
        }
    }

    /**
     * register a new analytics plugin in the managed list
     */
    public func registerAnalyticsPlugin(plugin: RNVAnalyticsPlugin) {
        analyticsPluginList.append(plugin)
        return
    }

    public func onInstanceCreated(id: String, player: Any) {
        analyticsPluginList.forEach { it in it.onInstanceCreated(id: id, player: player) }
    }

    public func onInstanceRemoved(id: String, player: Any) {
        analyticsPluginList.forEach { it in it.onInstanceRemoved(id: id, player: player) }
    }
}
