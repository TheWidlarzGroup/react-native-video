package com.brentvatne.react

import com.brentvatne.exoplayer.DRMManagerSpec

/**
 * Plugin interface definition
 */
interface RNVPlugin {
    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     */
    fun onInstanceCreated(id: String, player: Any)

    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     */
    fun onInstanceRemoved(id: String, player: Any)

    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return DRMManagerSpec implementation if plugin wants to handle DRM, null otherwise
     */
    fun getDRMManager(): DRMManagerSpec? {
        return null
    }
}
