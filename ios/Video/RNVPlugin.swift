//
//  RNVPlugin.swift
//  react-native-video
//

import Foundation

/**
 * class for RNV plugins that does not have dependencies or logic specific to any player
 * It is the base interface for all RNV plugins
 *
 * If you need to have dependencies or logic specific to a player, use the RNVAVPlayerPlugin
 */
open class RNVPlugin: NSObject {
    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     */
    open func onInstanceCreated(id _: String, player _: Any) { /* no-op */ }

    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     */
    open func onInstanceRemoved(id _: String, player _: Any) { /* no-op */ }
}
