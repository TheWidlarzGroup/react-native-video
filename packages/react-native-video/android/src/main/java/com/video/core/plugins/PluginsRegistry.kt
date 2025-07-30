package com.video.core.plugins

import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.video.BuildConfig
import com.video.view.VideoView
import java.lang.ref.WeakReference

typealias NativeVideoPlayer = HybridVideoPlayer
typealias NativeVideoPlayerSource = HybridVideoPlayerSource

public final class PluginsRegistry {
  // Plugin ID -> ReactNativeVideoPluginSpec
  private val plugins: MutableMap<String, ReactNativeVideoPluginSpec> = mutableMapOf()

  companion object {
    val shared = PluginsRegistry()
    private const val TAG = "PluginsRegistry"
  }

  // Public methods

  fun register(plugin: ReactNativeVideoPluginSpec) {
    if(hasPlugin(plugin)) {
      plugins.replace(plugin.id, plugin)

      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Updated plugin with ID: ${plugin.id}")
      }

      return
    }

    plugins.put(plugin.id, plugin)

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Registered plugin with ID: ${plugin.id}")
    }
  }

  fun unregister(plugin: ReactNativeVideoPluginSpec) {
    if (!hasPlugin(plugin)) {
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Tried to unregister plugin with ID: ${plugin.id}, but it was not registered")
      }

      return
    }

    plugins.remove(plugin.id)

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Unregistered plugin with ID: ${plugin.id}")
    }
  }

  // Notifications
  @OptIn(UnstableApi::class)
  internal fun notifyPlayerCreated(player: WeakReference<NativeVideoPlayer>) {
    plugins.values.forEach { it.onPlayerCreated(player) }
  }

  @OptIn(UnstableApi::class)
  internal fun notifyPlayerDestroyed(player: WeakReference<NativeVideoPlayer>) {
    plugins.values.forEach { it.onPlayerDestroyed(player) }
  }

  @OptIn(UnstableApi::class)
  internal fun notifyVideoViewCreated(view: WeakReference<VideoView>) {
    plugins.values.forEach { it.onVideoViewCreated(view) }
  }

  @OptIn(UnstableApi::class)
  internal fun notifyVideoViewDestroyed(view: WeakReference<VideoView>) {
    plugins.values.forEach { it.onVideoViewDestroyed(view) }
  }

  // Internal methods

  // TODO: Update type once DRM will be implemented
  /**
   * Returns the DRM manager instance from the plugins.
   *
   * @throws Exception If no DRM manager is found.
   * @return Any
   */
  internal fun getDRMManager(): Any {
    var drmManager: Any? = null

    for (plugin in plugins.values) {
      val manager = plugin.getDRMManager()

      if (manager != null) {
        drmManager = manager
        break
      }
    }

    if (drmManager == null) {
      // TODO: Create Exception For this
      throw Exception("No DRM manager found")
    }

    return drmManager
  }

  internal fun overrideMediaDataSourceFactory(
    source: NativeVideoPlayerSource,
    mediaDataSourceFactory: DataSource.Factory
  ): DataSource.Factory {
    for (plugin in plugins.values) {
      val factory = plugin.getMediaDataSourceFactory(source, mediaDataSourceFactory)

      if (factory != null) return factory
    }

    return mediaDataSourceFactory
  }

  internal fun overrideMediaSourceFactory(
    source: NativeVideoPlayerSource,
    mediaSourceFactory: MediaSource.Factory,
    mediaDataSourceFactory: DataSource.Factory
  ): MediaSource.Factory {
    for (plugin in plugins.values) {
      val factory = plugin.getMediaSourceFactory(source, mediaSourceFactory, mediaDataSourceFactory)

      if (factory != null) return factory
    }

    return mediaSourceFactory
  }

  internal fun overrideMediaItemBuilder(
    source: NativeVideoPlayerSource,
    mediaItemBuilder: MediaItem.Builder
  ): MediaItem.Builder {
    for (plugin in plugins.values) {
      val builder = plugin.getMediaItemBuilder(source, mediaItemBuilder)

      if (builder != null) return builder
    }

    return mediaItemBuilder
  }

  internal fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean {
    for (plugin in plugins.values) {
      val shouldDisable = plugin.shouldDisableCache(source)

      if (shouldDisable) return true
    }

    return false
  }

  internal fun hasPlugin(plugin: ReactNativeVideoPluginSpec): Boolean {
    return plugins.any { it.key == plugin.id }
  }
}