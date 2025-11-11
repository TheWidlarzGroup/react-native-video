package com.twg.video.react

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


class VideoPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return emptyList()
  }

  @OptIn(UnstableApi::class)
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(VideoViewViewManager())
  }

  companion object {
    init {
      System.loadLibrary("ReactNativeVideo")
    }
  }
}
