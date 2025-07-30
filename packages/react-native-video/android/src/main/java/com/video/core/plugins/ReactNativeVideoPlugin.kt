package com.video.core.plugins

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.source.MediaSource
import com.video.view.VideoView
import java.lang.ref.WeakReference
import java.util.UUID

public interface ReactNativeVideoPluginSpec {
  /**
   * The ID of the plugin.
   */
  val id: String

  // TODO: Make NativeVideoPlayer and NativeVideoPlayerSource type

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
   * Called when a source is overridden.
   *
   * @param source The source instance.
   * @return The overridden source instance.
   */
  fun overrideSource(source: Any): Any

  /**
   * Called when a DRM manager is requested.
   *
   * @return The DRM manager instance.
   */
  fun getDRMManager(): Any? { return null }


  /**
   * Called when a media data source factory is requested.
   *
   * @param source The source instance.
   * @param mediaDataSourceFactory The media data source factory.
   * @return The media data source factory.
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
   * @return The media source factory.
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
   * @return The media item builder.
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
public open class ReactNativeVideoPlugin : ReactNativeVideoPluginSpec {
  override val id = "RNV_Plugin_${UUID.randomUUID()}"

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

  override fun overrideSource(source: Any): Any { return source }

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