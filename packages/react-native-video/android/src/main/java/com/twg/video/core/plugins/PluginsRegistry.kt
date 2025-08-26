package com.twg.video.core.plugins

import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.source.MediaSource
import com.margelo.nitro.video.HybridVideoPlayer
import com.margelo.nitro.video.HybridVideoPlayerSource
import com.twg.video.BuildConfig
import com.twg.video.core.LibraryError
import com.twg.video.core.player.DRMManagerSpec
import com.twg.video.view.VideoView
import java.lang.ref.WeakReference

// Keep these types for platform compatibility
// On iOS we cannot just export HybridVideoPlayer so we need to keep this typealias
typealias NativeVideoPlayer = HybridVideoPlayer
typealias NativeVideoPlayerSource = HybridVideoPlayerSource

class PluginsRegistry {
  // Plugin ID -> ReactNativeVideoPluginSpec
  private val plugins: MutableMap<String, ReactNativeVideoPluginSpec> = mutableMapOf()

  companion object {
    val shared = PluginsRegistry()
    private const val TAG = "ReactNativeVideoPluginsRegistry"
  }

  // Public methods
  fun register(plugin: ReactNativeVideoPluginSpec) {
    if(hasPlugin(plugin)) {
      plugins.replace(plugin.id, plugin)

      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Replaced plugin ${plugin.name} (ID: ${plugin.id})")
      }

      return
    }

    plugins.put(plugin.id, plugin)

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Registered plugin ${plugin.name} (ID: ${plugin.id})")
    }
  }

  @Suppress("unused")
  fun unregister(plugin: ReactNativeVideoPluginSpec) {
    if (!hasPlugin(plugin)) {
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Tried to unregister plugin ${plugin.name} (ID: ${plugin.id}), but it was not registered")
      }

      return
    }

    plugins.remove(plugin.id)

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Unregistered plugin ${plugin.name} (ID: ${plugin.id})")
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

  /**
   * Maybe override the source with the plugins.
   * 
   * This method is used to override the source with the plugins.
   * It is called when a source is created and is used to override the source with the plugins.
   * 
   * It is not guaranteed that the source will be overridden with the plugins.
   * If no plugin overrides the source, the original source is returned.
   *
   * @param source The source instance.
   * @return The maybe overridden source instance.
   */
  internal fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource {
    var overriddenSource = source

    for (plugin in plugins.values) {
      overriddenSource = plugin.overrideSource(overriddenSource)
    }

    return overriddenSource
  }

  /**
   * Returns the DRM manager instance from the plugins.
   *
   * @throws LibraryError.DRMPluginNotFound If no DRM manager is found.
   * @return Any
   */
   internal fun getDRMManager(source: NativeVideoPlayerSource): DRMManagerSpec {
    for (plugin in plugins.values) {
      val manager = plugin.getDRMManager(source)

      if (manager != null) return manager
    }

    throw LibraryError.DRMPluginNotFound
  }

  /**
   * Maybe override the media data source factory with the plugins.
   *
   * If no plugin overrides the media data source factory, the original factory is returned.
   *
   * @param source The source instance.
   * @param mediaDataSourceFactory The media data source factory instance.
   * @return The maybe overridden media data source factory instance.
   */
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

  /**
   * Maybe override the media source factory with the plugins.
   *
   * If no plugin overrides the media source factory, the original factory is returned.
   *
   * @param source The source instance.
   * @param mediaSourceFactory The media source factory instance.
   * @param mediaDataSourceFactory The media data source factory instance.
   * @return The maybe overridden media source factory instance.
   */
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

  /**
   * Maybe override the media item builder with the plugins.
   *
   * If no plugin overrides the media item builder, the original builder is returned.
   *
   * @param source The source instance.
   * @param mediaItemBuilder The media item builder instance.
   * @return The maybe overridden media item builder instance.
   */
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

  /**
   * Maybe disable the cache with the plugins.
   *
   * If no plugin disables the cache, the original cache is not disabled.
   *
   * @param source The source instance.
   * @return The maybe disabled cache.
   */
  internal fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean {
    for (plugin in plugins.values) {
      val shouldDisable = plugin.shouldDisableCache(source)

      if (shouldDisable) return true
    }

    return false
  }

  /**
   * Checks if a plugin is registered.
   *
   * @param plugin The plugin instance.
   * @return True if the plugin is registered, false otherwise.
   */
  internal fun hasPlugin(plugin: ReactNativeVideoPluginSpec): Boolean {
    return plugins.any { it.key == plugin.id }
  }
}