package com.twg.videodrm

import com.twg.videodrm.DRMManager.DRMManager
import com.twg.video.core.player.DRMManagerSpec
import com.twg.video.core.plugins.NativeVideoPlayerSource
import com.twg.video.core.plugins.ReactNativeVideoPlugin

class DRMPlugin(name: String) : ReactNativeVideoPlugin(name) {
  override fun getDRMManager(source: NativeVideoPlayerSource): DRMManagerSpec? {
    return DRMManager(source)
  }
}