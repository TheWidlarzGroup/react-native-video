package com.brentvatne.react

/**
 * Analytics plugin interface definition
 */
interface RNVAnalyticsPlugin {
    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     */
    fun onInstanceCreated(id: String, player: Any)

    /**
     * Function called when a player should be destroyed
     * when this callback is called, the analytics plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     */
    fun onInstanceRemoved(id: String, player: Any)
}
