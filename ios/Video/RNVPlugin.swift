//
//  RNVPlugin.swift
//  react-native-video
//

import Foundation

/**
 * Protocol for RNV plugins that does not have dependencies or logic specific to any player
 * It is the base interface for all RNV plugins
 *
 * If you need to have dependencies or logic specific to a player, use the RNVAVPlayerPlugin
 */
public protocol RNVPlugin {
    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     */
    func onInstanceCreated(id: String, player: Any)
    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     */
    func onInstanceRemoved(id: String, player: Any)
}
