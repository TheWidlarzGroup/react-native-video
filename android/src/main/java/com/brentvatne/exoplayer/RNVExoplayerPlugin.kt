package com.brentvatne.exoplayer

import androidx.media3.exoplayer.ExoPlayer
import com.brentvatne.react.RNVPlugin

/**
 * Interface for RNV plugins that have dependencies or logic that is specific to Exoplayer
 * It extends the RNVPlugin interface
 */
interface RNVExoplayerPlugin : RNVPlugin {
    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return DRMManagerSpec implementation if plugin wants to handle DRM, null otherwise
     */
    fun getDRMManager(): DRMManagerSpec? = null

    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     * @note: This is helper that ensure that player is non null ExoPlayer
     */
    fun onInstanceCreated(id: String, player: ExoPlayer)

    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     * @note: This is helper that ensure that player is non null ExoPlayer
     */
    fun onInstanceRemoved(id: String, player: ExoPlayer)

    override fun onInstanceCreated(id: String, player: Any) {
        if (player is ExoPlayer) {
            onInstanceCreated(id, player)
        }
    }

    override fun onInstanceRemoved(id: String, player: Any) {
        if (player is ExoPlayer) {
            onInstanceRemoved(id, player)
        }
    }
}
