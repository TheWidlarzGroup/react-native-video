package com.brentvatne.react

import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.exoplayer.DRMManagerSpec

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

        // Check if plugin provides DRM manager
        plugin.getDRMManager()?.let { drmManager ->
            if (customDRMManager != null) {
                DebugLog.w("ReactNativeVideoManager", "Multiple DRM managers registered. This is not supported. Using first registered manager.")
                return@let
            }
            customDRMManager = drmManager
        }
    }

    /**
     * unregister a plugin from the managed list
     */
    fun unregisterPlugin(plugin: RNVPlugin) {
        pluginList.remove(plugin)

        // If this plugin provided the DRM manager, remove it
        if (plugin.getDRMManager() === customDRMManager) {
            customDRMManager = null
        }
    }

    override fun onInstanceCreated(id: String, player: Any) {
        pluginList.forEach { it.onInstanceCreated(id, player) }
    }

    override fun onInstanceRemoved(id: String, player: Any) {
        pluginList.forEach { it.onInstanceRemoved(id, player) }
    }

    override fun getDRMManager(): DRMManagerSpec? = customDRMManager
}
