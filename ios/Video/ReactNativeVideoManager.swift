//
//  ReactNativeVideoManager.swift
//  react-native-video
//

import Foundation

public class ReactNativeVideoManager: RNVPlugin {
    private let expectedMaxVideoCount = 10

    // create a private initializer
    private init() {}

    public static let shared: ReactNativeVideoManager = .init()

    var instanceList: [RCTVideo] = Array()
    var pluginList: [RNVPlugin] = Array()

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
     * register a new plugin in the managed list
     */
    public func registerPlugin(plugin: RNVPlugin) {
        pluginList.append(plugin)
        return
    }

    public func onInstanceCreated(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceCreated(id: id, player: player) }
    }

    public func onInstanceRemoved(id: String, player: Any) {
        pluginList.forEach { it in it.onInstanceRemoved(id: id, player: player) }
    }
}
