package com.brentvatne.react

import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.source.MediaSource
import com.brentvatne.common.api.Source
import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.exoplayer.DRMManagerSpec
import com.brentvatne.exoplayer.RNVExoplayerPlugin

/**
 * ReactNativeVideoManager is a singleton class which allows to manipulate / the global state of the app
 * It handles the list of <Video/> view instanced and registration of plugins
 */
class ReactNativeVideoManager : RNVPlugin {
    companion object {
        private const val TAG = "ReactNativeVideoManager"

        @Volatile
        private var instance: ReactNativeVideoManager? = null

        /**
         * Singleton accessor
         */
        fun getInstance(): ReactNativeVideoManager =
            instance ?: synchronized(this) {
                instance ?: ReactNativeVideoManager().also { instance = it }
            }
    }

    private val pluginList = ArrayList<RNVPlugin>()
    private var customDRMManager: DRMManagerSpec? = null
    private var instanceList: ArrayList<Any> = ArrayList()

    /**
     * register a new ReactExoplayerViewManager in the managed list
     */
    fun registerView(newInstance: Any) {
        if (instanceList.size > 2) {
            DebugLog.d(TAG, "multiple Video displayed ?")
        }
        instanceList.add(newInstance)
    }

    /**
     * unregister existing ReactExoplayerViewManager in the managed list
     */
    fun unregisterView(newInstance: Any) {
        instanceList.remove(newInstance)
    }

    /**
     * register a new plugin in the managed list
     */
    fun registerPlugin(plugin: RNVPlugin) {
        pluginList.add(plugin)

        maybeRegisterExoplayerPlugin(plugin)
    }

    /**
     * unregister a plugin from the managed list
     */
    fun unregisterPlugin(plugin: RNVPlugin) {
        pluginList.remove(plugin)

        maybeUnregisterExoplayerPlugin(plugin)
    }

    // ----------------------- Generic RNV plugin methods -----------------------
    override fun onInstanceCreated(id: String, player: Any) {
        pluginList.forEach { it.onInstanceCreated(id, player) }
    }

    override fun onInstanceRemoved(id: String, player: Any) {
        pluginList.forEach { it.onInstanceRemoved(id, player) }
    }

    // ----------------------- RNV Exoplayer plugin specific methods -----------------------
    fun getDRMManager(): DRMManagerSpec? = customDRMManager

    fun overrideDrmSessionManager(source: Source, drmSessionManager: DrmSessionManager): DrmSessionManager? {
        for (plugin in pluginList) {
            if (plugin !is RNVExoplayerPlugin) continue

            val overriddenManager = plugin.overrideDrmSessionManager(source, drmSessionManager)
            if (overriddenManager != null) return overriddenManager
        }
        return null
    }

    fun overrideMediaDataSourceFactory(source: Source, mediaDataSourceFactory: DataSource.Factory): DataSource.Factory? {
        for (plugin in pluginList) {
            if (plugin !is RNVExoplayerPlugin) continue

            val factory = plugin.overrideMediaDataSourceFactory(source, mediaDataSourceFactory)
            if (factory != null) return factory
        }
        return null
    }

    fun overrideMediaSourceFactory(source: Source, mediaSourceFactory: MediaSource.Factory, mediaDataSourceFactory: DataSource.Factory): MediaSource.Factory? {
        for (plugin in pluginList) {
            if (plugin !is RNVExoplayerPlugin) continue

            val factory = plugin.overrideMediaSourceFactory(source, mediaSourceFactory, mediaDataSourceFactory)
            if (factory != null) return factory
        }
        return null
    }

    fun overrideMediaItemBuilder(source: Source, mediaItemBuilder: MediaItem.Builder): MediaItem.Builder? {
        for (plugin in pluginList) {
            if (plugin !is RNVExoplayerPlugin) continue

            val builder = plugin.overrideMediaItemBuilder(source, mediaItemBuilder)
            if (builder != null) return builder
        }
        return null
    }

    fun shouldDisableCache(source: Source): Boolean {
        for (plugin in pluginList) {
            if (plugin is RNVExoplayerPlugin && plugin.shouldDisableCache(source)) {
                return true
            }
        }
        return false
    }

    // ----------------------- Custom Plugins Helpers -----------------------
    private fun maybeRegisterExoplayerPlugin(plugin: RNVPlugin) {
        if (plugin !is RNVExoplayerPlugin) {
            return
        }

        // Check if plugin provides DRM manager
        plugin.getDRMManager()?.let { drmManager ->
            if (customDRMManager != null) {
                DebugLog.w("ReactNativeVideoManager", "Multiple DRM managers registered. This is not supported. Using first registered manager.")
                return@let
            }
            customDRMManager = drmManager
        }
    }

    private fun maybeUnregisterExoplayerPlugin(plugin: RNVPlugin) {
        if (plugin !is RNVExoplayerPlugin) {
            return
        }

        // If this plugin provided the DRM manager, remove it
        if (plugin.getDRMManager() === customDRMManager) {
            customDRMManager = null
        }
    }
}
