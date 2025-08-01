---
title: Plugin Interface
description: Reference for the React Native Video plugin interface
sidebar_position: 2
---

# Plugin Interface Reference

This document provides a complete reference for the `ReactNativeVideoPluginSpec` interface and the base `ReactNativeVideoPlugin` implementation.

## ReactNativeVideoPluginSpec Interface

### Required Properties

#### id: String
Unique identifier for the plugin. Must be unique across all registered plugins.

```kotlin
// Android
override val id: String = "my_unique_plugin_id"
```

```swift
// iOS
var id: String { "my_unique_plugin_id" }
```

#### name: String
Human-readable name for the plugin, used in debug logging.

```kotlin
// Android
override val name: String = "My Custom Plugin"
```

```swift
// iOS
var name: String { "My Custom Plugin" }
```

## Lifecycle Methods

### Player Lifecycle

#### onPlayerCreated
Called when a new player instance is created.

```kotlin
// Android
@UnstableApi
fun onPlayerCreated(player: WeakReference<NativeVideoPlayer>)
```

```swift
// iOS
func onPlayerCreated(player: Weak<NativeVideoPlayer>)
```

**Parameters:**
- `player`: Weak reference to the newly created player instance

**Use Cases:**
- Initialize player-specific resources
- Set up player event listeners
- Configure player settings

#### onPlayerDestroyed
Called when a player instance is being destroyed.

```kotlin
// Android
@UnstableApi
fun onPlayerDestroyed(player: WeakReference<NativeVideoPlayer>)
```

```swift
// iOS
func onPlayerDestroyed(player: Weak<NativeVideoPlayer>)
```

**Parameters:**
- `player`: Weak reference to the player instance being destroyed

**Use Cases:**
- Clean up player-specific resources
- Remove event listeners
- Save state or analytics data

### Video View Lifecycle

#### onVideoViewCreated
Called when a new video view is created.

```kotlin
// Android
@UnstableApi
fun onVideoViewCreated(view: WeakReference<VideoView>)
```

```swift
// iOS
func onVideoViewCreated(view: Weak<VideoComponentView>)
```

**Parameters:**
- `view`: Weak reference to the newly created video view

**Use Cases:**
- Configure view-specific settings
- Set up UI event handlers
- Initialize view overlays

#### onVideoViewDestroyed
Called when a video view is being destroyed.

```kotlin
// Android
@UnstableApi
fun onVideoViewDestroyed(view: WeakReference<VideoView>)
```

```swift
// iOS
func onVideoViewDestroyed(view: Weak<VideoComponentView>)
```

**Parameters:**
- `view`: Weak reference to the video view being destroyed

**Use Cases:**
- Clean up view-specific resources
- Remove UI event handlers
- Save view state

## Content Modification Methods

### overrideSource
Modify the video source before it's processed by the player.

```kotlin
// Android
fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource
```

```swift
// iOS
func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource
```

**Parameters:**
- `source`: The original video source

**Returns:**
- Modified video source (can be the same instance if no changes needed)

**Use Cases:**
- Add authentication headers
- Modify URLs (e.g., CDN switching)
- Add tracking parameters
- Transform source format

### getDRMManager
Provide a custom DRM manager for protected content.

```kotlin
// Android
fun getDRMManager(source: NativeVideoPlayerSource): Any?
```

```swift
// iOS
func getDRMManager(source: NativeVideoPlayerSource) async -> Any?
```

**Parameters:**
- `source`: The video source that may require DRM

**Returns:**
- DRM manager instance, or `null` if this plugin doesn't handle DRM for this source

**Use Cases:**
- Widevine DRM implementation
- FairPlay DRM implementation
- Custom DRM solutions
- License acquisition logic

## Android-Specific Methods

### getMediaDataSourceFactory
Override the data source factory used by ExoPlayer.

```kotlin
fun getMediaDataSourceFactory(
    source: NativeVideoPlayerSource,
    mediaDataSourceFactory: DataSource.Factory
): DataSource.Factory?
```

**Parameters:**
- `source`: The video source
- `mediaDataSourceFactory`: The default data source factory

**Returns:**
- Custom data source factory, or `null` to use the default

**Use Cases:**
- Custom caching strategies
- Network optimization
- Custom authentication
- Analytics data collection

### getMediaSourceFactory
Override the media source factory used by ExoPlayer.

```kotlin
fun getMediaSourceFactory(
    source: NativeVideoPlayerSource,
    mediaSourceFactory: MediaSource.Factory,
    mediaDataSourceFactory: DataSource.Factory
): MediaSource.Factory?
```

**Parameters:**
- `source`: The video source
- `mediaSourceFactory`: The default media source factory
- `mediaDataSourceFactory`: The data source factory

**Returns:**
- Custom media source factory, or `null` to use the default

**Use Cases:**
- Custom media format support
- Advanced ExoPlayer configuration
- Source-specific optimizations

### getMediaItemBuilder
Override the media item builder used by ExoPlayer.

```kotlin
fun getMediaItemBuilder(
    source: NativeVideoPlayerSource,
    mediaItemBuilder: MediaItem.Builder
): MediaItem.Builder?
```

**Parameters:**
- `source`: The video source
- `mediaItemBuilder`: The default media item builder

**Returns:**
- Modified media item builder, or `null` to use the default

**Use Cases:**
- Add custom metadata
- Configure subtitles
- Set playback preferences
- Configure DRM settings

### shouldDisableCache
Control whether caching should be disabled for a source.

```kotlin
fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean
```

**Parameters:**
- `source`: The video source

**Returns:**
- `true` to disable caching, `false` to allow caching

**Use Cases:**
- Disable caching for live streams
- Disable caching for DRM content
- Custom caching policies

## Base Implementation: ReactNativeVideoPlugin

The base class provides default implementations for all methods:

### Automatic Registration
```kotlin
// Android
init {
    PluginsRegistry.shared.register(this)
}
```

```swift
// iOS
public init(name: String) {
    self.name = name
    self.id = "RNV_Plugin_\(name)"
    PluginsRegistry.shared.register(plugin: self)
}
```

### Automatic Cleanup (iOS only)
```swift
deinit {
    PluginsRegistry.shared.unregister(plugin: self)
}
```

### Default Implementations

All methods have sensible defaults:
- Lifecycle methods: No-op implementations
- `overrideSource`: Returns the original source unchanged
- `getDRMManager`: Returns `null`
- Factory methods (Android): Return `null` (use defaults)
- `shouldDisableCache`: Returns `false`

## Method Calling Order

### Source Processing Flow
1. `overrideSource` - Called for each registered plugin in order
2. `getDRMManager` - Called for each plugin until one returns non-null
3. Factory methods (Android) - Called for each plugin until one returns non-null

### Lifecycle Flow
1. View/Player creation methods called for all plugins
2. Source processing happens during playback
3. View/Player destruction methods called for all plugins

## Error Handling

### DRM Plugin Not Found
If no plugin provides a DRM manager when required:

```kotlin
// Android
throw LibraryError.DRMPluginNotFound
```

```swift
// iOS
throw LibraryError.DRMPluginNotFound.error()
```

### Best Practices
- Return `null` from optional methods when not providing custom behavior
- Handle weak reference nullability properly
- Use appropriate error handling in async methods (iOS)
- Log meaningful debug information

## Platform Differences Summary

| Feature | Android | iOS |
|---------|---------|-----|
| Async Support | No | Yes (async/await) |
| Media Factories | Full ExoPlayer support | Limited AVFoundation |
| Cache Control | Yes | No |
| Auto Cleanup | Manual | Automatic (deinit) |
| Weak References | `WeakReference<T>` | `Weak<T>` |