package com.brentvatne.react

import com.brentvatne.exoplayer.DefaultReactExoplayerConfig
import com.brentvatne.exoplayer.ReactExoplayerConfig
import com.brentvatne.exoplayer.ReactExoplayerViewManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ReactVideoPackage @JvmOverloads constructor(private var config: ReactExoplayerConfig? = null) : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(
            VideoDecoderPropertiesModule(reactContext),
            VideoManagerModule(reactContext)
        )

    // Deprecated RN 0.47
    fun createJSModules(): List<Class<out JavaScriptModule>> = emptyList()

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        if (config == null) {
            config = DefaultReactExoplayerConfig(reactContext)
        }
        return listOf(ReactExoplayerViewManager(config!!))
    }
}
