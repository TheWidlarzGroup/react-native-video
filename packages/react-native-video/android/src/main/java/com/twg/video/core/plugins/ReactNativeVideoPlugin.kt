package com.twg.video.core.plugins

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.source.MediaSource
import com.twg.video.core.player.DRMManagerSpec
import com.twg.video.view.VideoView
import java.lang.ref.WeakReference

interface ReactNativeVideoPluginSpec {
  /**
   * The ID of the plugin.
   */
  val id: String

  /**
   * The name of the plugin.
   */
  val name: String

  /**
   * Called when a player is created.
   *
   * @param player The weak reference to the player instance.
   */
  @UnstableApi
  fun onPlayerCreated(player: WeakReference<NativeVideoPlayer>)

  /**
   * Called when a player is destroyed.
   *
   * @param player The weak reference to the player instance.
   */
  @UnstableApi
  fun onPlayerDestroyed(player: WeakReference<NativeVideoPlayer>)

  /**
   * Called when a video view is created.
   *
   * @param view The weak reference to the video view instance.
   */
  @UnstableApi
  fun onVideoViewCreated(view: WeakReference<VideoView>)

  /**
   * Called when a video view is destroyed.
   *
   * @param view The weak reference to the video view instance.
   */
  @UnstableApi
  fun onVideoViewDestroyed(view: WeakReference<VideoView>)
  
  /**
   * Called when a source is being used to create mediaItem or MediaSource.
   * You can use it to modify the source before it is used.
   *
   * @param source The source instance.
   * @return The overridden source instance.
   */
  fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource

  /**
   * Called when a DRM manager is requested.
   *
   * @return The DRM manager instance.
   */
  fun getDRMManager(source: NativeVideoPlayerSource): DRMManagerSpec?


  /**
   * Called when a media data source factory is requested.
   *
   * @param source The source instance.
   * @param mediaDataSourceFactory The media data source factory.
   * @return The media data source factory. If null is returned, the default factory will be used.
   */
  fun getMediaDataSourceFactory(
    source: NativeVideoPlayerSource,
    mediaDataSourceFactory: DataSource.Factory
  ): DataSource.Factory?

  /**
   * Called when a media source factory is requested.
   *
   * @param source The source instance.
   * @param mediaSourceFactory The media source factory.
   * @param mediaDataSourceFactory The media data source factory.
   * @return The media source factory. If null is returned, the default factory will be used.
   */
  fun getMediaSourceFactory(
    source: NativeVideoPlayerSource,
    mediaSourceFactory: MediaSource.Factory,
    mediaDataSourceFactory: DataSource.Factory
  ): MediaSource.Factory?

  /**
   * Called when a media item builder is requested.
   *
   * @param source The source instance.
   * @param mediaItemBuilder The media item builder.
   * @return The media item builder. If null is returned, the default builder will be used.
   */
  fun getMediaItemBuilder(
    source: NativeVideoPlayerSource,
    mediaItemBuilder: MediaItem.Builder
  ): MediaItem.Builder?

  /**
   * Called when a cache should be disabled.
   *
   * @param source The source instance.
   * @return True if cache should be disabled, false otherwise.
   */
  fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean
}

@Suppress("Unused")
/**
 * A helper base implementation of the ReactNativeVideoPluginSpec interface.
 */
open class ReactNativeVideoPlugin(override val name: String) : ReactNativeVideoPluginSpec {
  override val id = "RNV_Plugin_${name}"

  init {
    // Automatically register the plugin when it is created
    PluginsRegistry.shared.register(this)
  }

  @UnstableApi
  override fun onPlayerCreated(player: WeakReference<NativeVideoPlayer>) { /* NOOP */}

  @UnstableApi
  override fun onPlayerDestroyed(player: WeakReference<NativeVideoPlayer>) { /* NOOP */}

  @UnstableApi
  override fun onVideoViewCreated(view: WeakReference<VideoView>) { /* NOOP */}

  @UnstableApi
  override fun onVideoViewDestroyed(view: WeakReference<VideoView>) { /* NOOP */}

  override fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource {
    return source
  }

  override fun getDRMManager(source: NativeVideoPlayerSource): DRMManagerSpec? { return null }

  override fun getMediaDataSourceFactory(
    source: NativeVideoPlayerSource,
    mediaDataSourceFactory: DataSource.Factory
  ): DataSource.Factory? {
    return null
  }

  override fun getMediaSourceFactory(
    source: NativeVideoPlayerSource,
    mediaSourceFactory: MediaSource.Factory,
    mediaDataSourceFactory: DataSource.Factory
  ): MediaSource.Factory? {
    return null
  }

  override fun getMediaItemBuilder(
    source: NativeVideoPlayerSource,
    mediaItemBuilder: MediaItem.Builder
  ): MediaItem.Builder? {
    return null
  }

  override fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean {
    return false
  }
}