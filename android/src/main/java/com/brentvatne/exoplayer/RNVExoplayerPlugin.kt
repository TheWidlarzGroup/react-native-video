package com.brentvatne.exoplayer

import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.source.MediaSource
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
     * Optional function that allows the plugin to override the DrmSessionManager after it has been created.
     * This is called after buildDrmSessionManager and allows for final modifications to the DrmSessionManager.
     * @param source The media source being initialized.
     * @param drmSessionManager The current DrmSessionManager instance.
     * @return A modified DrmSessionManager if override is needed, or null to use original.
     */
    fun overrideDrmSessionManager(source: Source, drmSessionManager: DrmSessionManager): DrmSessionManager? = null

    /**
     * Optional function that allows the plugin to override the media data source factory,
     * which is responsible for loading media data.
     * @param source The media source being initialized.
     * @param mediaDataSourceFactory The current default data source factory.
     * @return A custom [DataSource.Factory] if override is needed, or null to use default.
     */
    fun overrideMediaDataSourceFactory(source: Source, mediaDataSourceFactory: DataSource.Factory): DataSource.Factory? = null

    /**
     * Optional function that allows the plugin to override the media source factory,
     * which is responsible for loading media data.
     * @param source The media source being initialized.
     * @param mediaSourceFactory The current media source factory.
     * @param mediaDataSourceFactory The current default data source factory.
     * @return A custom [MediaSource.Factory] if override is needed, or null to use default.
     */
    fun overrideMediaSourceFactory(source: Source, mediaSourceFactory: MediaSource.Factory, mediaDataSourceFactory: DataSource.Factory): MediaSource.Factory? =
        null

    /**
     * Optional function that allows the plugin to modify the [MediaItem.Builder]
     * before the final [MediaItem] is created.
     * @param source The source from which the media item is being built.
     * @param mediaItemBuilder The default [MediaItem.Builder] instance.
     * @return A modified builder instance if override is needed, or null to use original.
     */
    fun overrideMediaItemBuilder(source: Source, mediaItemBuilder: MediaItem.Builder): MediaItem.Builder? = null

    /**
     * Optional function that allows the plugin to control whether caching should be disabled
     * for a given video source.
     * @param source The video source being loaded.
     * @return true to disable caching, false to keep it enabled.
     */
    fun shouldDisableCache(source: Source): Boolean = false

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
