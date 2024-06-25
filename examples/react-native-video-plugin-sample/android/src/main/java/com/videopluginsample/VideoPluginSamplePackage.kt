package com.videopluginsample

import com.brentvatne.react.ReactNativeVideoManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class VideoPluginSamplePackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    val plugin = VideoPluginSampleModule(reactContext)
    ReactNativeVideoManager.getInstance().registerPlugin(plugin)
    return listOf(plugin)
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
