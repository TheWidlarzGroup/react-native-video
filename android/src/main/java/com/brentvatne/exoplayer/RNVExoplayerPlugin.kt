package com.brentvatne.exoplayer

import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.ExoPlayer
import com.brentvatne.common.api.Source
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
     * Optional function that allows the plugin to override the media data source factory,
     * which is responsible for loading the video data.
     * @return A lambda that takes a [Source] and the current [DataSource.Factory],
     *         and returns a custom [DataSource.Factory], or null to use the default one.
     */
    fun overrideMediaDataSourceFactory(): ((Source, DataSource.Factory) -> DataSource.Factory?)? = null

    /**
     * Optional function that allows plugin to override the MediaItem builder
     * before the MediaItem is created.
     * @return A lambda that takes a [Source] and the current [MediaItem.Builder],
     *         and returns a modified [MediaItem.Builder], or null if no override is needed.
     */
    fun overrideMediaItemBuilder(): ((Source, MediaItem.Builder) -> MediaItem.Builder?)? = null

    /**
     * Optional function that allows the plugin to control whether caching should be disabled
     * for a given video source.
     * @return A lambda that takes a [Source] and returns true if caching should be disabled,
     *         or false to allow caching. Returns null to use the default behavior.
     */
    fun shouldDisableCache(): ((source: Source) -> Boolean)? = null

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
