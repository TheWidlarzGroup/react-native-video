package com.margelo.nitro.videodrm
  
import com.facebook.proguard.annotations.DoNotStrip
import com.twg.videodrm.DRMPlugin
import com.twg.video.core.plugins.PluginsRegistry

@DoNotStrip
class PluginManager : HybridPluginManagerSpec() {
  private var plugin: DRMPlugin? = null

  override val isEnabled: Boolean
    get() = plugin != null

  override fun enable() {
    if (isEnabled) {
      return
    }

    initializePlugin()
  }

  override fun disable() {
    if (!isEnabled) {
      return
    }

    destroyPlugin()
  }

  private fun initializePlugin() {
    plugin = DRMPlugin("ReactNativeVideoDRM")

    plugin?.let {
      PluginsRegistry.shared.register(it)
    } ?: throw Error("Failed to initialize DRM plugin.")
  }

  private fun destroyPlugin() {
    plugin?.let {
      PluginsRegistry.shared.unregister(it)
    } ?: throw Error("Plugin is not initialized!")

    plugin = null
  }

  override fun dispose() {
    if (isEnabled) {
      try {
        destroyPlugin()
      } catch (_: Exception) { }
    }
  }
}
