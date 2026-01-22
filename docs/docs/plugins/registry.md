---
title: Plugin Registry  
description: Overview of the React Native Video plugin registry and how to use it
sidebar_position: 1
---

# Plugin Registry

The `PluginsRegistry` is a singleton that manages all plugin instances and coordinates their interactions with the video player system. It handles registration, unregistration, and notification distribution to all active plugins.

## Singleton Pattern

Both Android and iOS use a shared singleton:

```kotlin title="Android"
// Register
PluginsRegistry.shared.register(plugin)
// Unregister
PluginsRegistry.shared.unregister(plugin)
```

```swift title="iOS"
// Register
PluginsRegistry.shared.register(plugin: plugin)
// Unregister
PluginsRegistry.shared.unregister(plugin: plugin)
```

:::tip Plugin Ordering
Plugins are processed in registration order. Later plugins can override earlier ones.
:::

## Registration Methods

### Automatic Registration

You can use the base class `ReactNativeVideoPlugin` to automatically register your plugin. This will also mock all the methods that are not implemented in your plugin. 

:::danger
You still need to unregister your plugin manually when you are done with it. Otherwise, you will have a memory leak.
:::

```kotlin title="Android"
class MyPlugin : ReactNativeVideoPlugin("MyPlugin") {
    // ...
}
val plugin = MyPlugin() // Auto-registered
```

```swift title="iOS"
class MyPlugin: ReactNativeVideoPlugin {
    init() {
        super.init(name: "MyPlugin")
    }
    // Auto-unregistered in deinit
}
let plugin = MyPlugin() // Auto-registered
```

### Manual Registration

You can also manually register your plugin. This is useful if you want to implement a plugin that is not a subclass of `ReactNativeVideoPlugin`.
You will need to implement the `ReactNativeVideoPluginSpec` interface. This is a protocol that defines the methods and properties that a plugin must implement.

```kotlin title="Android"
class MyCustomPlugin : ReactNativeVideoPluginSpec {
    override val id = "my_custom_id"
    override val name = "MyCustomPlugin"
    // ...
}
val plugin = MyCustomPlugin()
PluginsRegistry.shared.register(plugin)
```

```swift title="iOS"
class MyCustomPlugin: ReactNativeVideoPluginSpec {
    let id = "my_custom_id"
    let name = "MyCustomPlugin"
    // ...
}
let plugin = MyCustomPlugin()
PluginsRegistry.shared.register(plugin: plugin)
```

## Plugin ID Generation

When using the base class, IDs are auto-generated:

```kotlin title="Android"
ID Format: "RNV_Plugin_{name}"
Example: "RNV_Plugin_MyCustomDRM"
```

```swift title="iOS"
ID Format: "RNV_Plugin_{name}"
Example: "RNV_Plugin_MyCustomDRM"
```

## Plugin Internals

Bellow are the internals of the plugin registry, that shows logic for certain methods.

### Source Processing

The registry coordinates source modifications:

```kotlin title="Android"
internal fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource {
    var overriddenSource = source
    for (plugin in plugins.values) {
        overriddenSource = plugin.overrideSource(overriddenSource)
    }
    return overriddenSource
}
```

```swift title="iOS"
internal func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
    var overriddenSource = source
    for plugin in plugins.values {
        overriddenSource = await plugin.overrideSource(source: source)
    }
    return overriddenSource
}
```

### DRM Manager Resolution

Finds the first plugin that can provide a DRM manager:

```kotlin title="Android"
internal fun getDRMManager(source: NativeVideoPlayerSource): Any {
    for (plugin in plugins.values) {
        val manager = plugin.getDRMManager(source)
        if (manager != null) return manager
    }
    throw LibraryError.DRMPluginNotFound
}
```

```swift title="iOS"
internal func getDrmManager(source: NativeVideoPlayerSource) async throws -> Any? {
    for plugin in plugins.values {
        if let drmManager = await plugin.getDRMManager(source: source) {
            return drmManager
        }
    }
    throw LibraryError.DRMPluginNotFound.error()
}
```

## Android-Specific Registry Methods

| Method Name                       | Purpose                                                   |
|:----------------------------------|:----------------------------------------------------------|
| `overrideMediaDataSourceFactory`  | Override data source factory for custom ExoPlayer sources  |
| `overrideMediaSourceFactory`      | Override media source factory                             |
| `overrideMediaItemBuilder`        | Customize the media item builder                          |
| `shouldDisableCache`              | Control caching behavior                                  |

Example signatures:

```kotlin
internal fun overrideMediaDataSourceFactory(
    source: NativeVideoPlayerSource,
    mediaDataSourceFactory: DataSource.Factory
): DataSource.Factory

internal fun overrideMediaSourceFactory(
    source: NativeVideoPlayerSource,
    mediaSourceFactory: MediaSource.Factory,
    mediaDataSourceFactory: DataSource.Factory
): MediaSource.Factory

internal fun overrideMediaItemBuilder(
    source: NativeVideoPlayerSource,
    mediaItemBuilder: MediaItem.Builder
): MediaItem.Builder

internal fun shouldDisableCache(source: NativeVideoPlayerSource): Boolean
```

## Best Practices

-  **Memory management**: Registry holds strong references to plugins; plugins get weak references to players/views.
-  **Unregister plugins**: Use unregistration to prevent memory leaks.
-  **Performance**: Minimize work in notification handlers. Cache expensive operations. Be mindful of plugin order.

