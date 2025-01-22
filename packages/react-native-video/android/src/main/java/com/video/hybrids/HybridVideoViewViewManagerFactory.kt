package com.margelo.nitro.video

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class HybridVideoViewViewManagerFactory: HybridVideoViewViewManagerFactorySpec() {
  override fun createViewManager(nitroId: Double): HybridVideoViewViewManagerSpec {
    return HybridVideoViewViewManager(nitroId.toInt())
  }

  override val memorySize: Long
    get() = 0
}
