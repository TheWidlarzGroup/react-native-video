package com.brentvatne.react

import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.exoplayer.ReactExoplayerViewManager

/**
 * ReactNativeVideoManager is a singleton class which allows to manipulate / the global state of the app
 * It handles the list of <Video view instanced and registration of analytics plugins
 */
class ReactNativeVideoManager : RNVAnalyticsPlugin {
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

    private var instanceList: ArrayList<ReactExoplayerViewManager> = ArrayList()
    private var analyticsPluginList: ArrayList<RNVAnalyticsPlugin> = ArrayList()

    /**
     * register a new ReactExoplayerViewManager in the managed list
     */
    fun registerView(newInstance: ReactExoplayerViewManager): () -> Boolean =
        {
            if (instanceList.size > 2) {
                DebugLog.d(TAG, "multiple Video displayed ?")
            }
            instanceList.add(newInstance)
        }

    /**
     * unregister existing ReactExoplayerViewManager in the managed list
     */
    fun unregisterView(newInstance: ReactExoplayerViewManager): () -> Boolean =
        {
            instanceList.remove(newInstance)
        }

    /**
     * register a new analytics plugin in the managed list
     */
    fun registerAnalyticsPlugin(plugin: RNVAnalyticsPlugin) {
        analyticsPluginList.add(plugin)
        return
    }

    /**
     * unregister a analytics plugin from the managed list
     */
    fun unregisterAnalyticsPlugin(plugin: RNVAnalyticsPlugin) {
        analyticsPluginList.remove(plugin)
        return
    }

    override fun onInstanceCreated(id: String, player: Any) {
        analyticsPluginList.forEach { it.onInstanceCreated(id, player) }
    }

    override fun onInstanceRemoved(id: String, player: Any) {
        analyticsPluginList.forEach { it.onInstanceRemoved(id, player) }
    }
}
