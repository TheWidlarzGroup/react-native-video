# Plugin

Since version `6.4.0`, it is possible to create plugins for analytics management and potentially more.
A sample plugin is available in the repository: [example/react-native-video-plugin-sample](https://github.com/TheWidlarzGroup/react-native-video/tree/master/examples/react-native-video-plugin-sample).

## Commercial Plugins

We at The Widlarz Group have created a set of plugins for comprehensive offline video support. If you are interested, check out our [Offline Video SDK](https://www.thewidlarzgroup.com/offline-video-sdk/?utm_source=rnv&utm_medium=docs&utm_campaign=plugins&utm_id=text). If you need additional plugins (analytics, processing, etc.), let us know.

> Using or recommending our commercial software helps support the maintenance of this open-source project. Thank you!

## Plugins for Analytics

Most analytics systems that track player data (e.g., bitrate, errors) can be integrated directly with ExoPlayer or AVPlayer.
This plugin system allows for non-intrusive analytics integration with `react-native-video`. It should be implemented in native languages (Kotlin/Swift) to ensure efficiency.

The goal is to enable easy analytics integration without modifying `react-native-video` itself.

## Warnings & Considerations

This is an **experimental API** and may change over time. The API is simple yet flexible enough to implement analytics systems.
If additional metadata is needed, you should implement a setter in your custom package.

Since the API is flexible, misuse is possible. The player handle should be treated as **read-only**. Modifying player behavior may cause unexpected issues in `react-native-video`.

## General Setup

First, create a new React Native package:

```shell
npx create-react-native-library@latest react-native-video-custom-analytics
```

Both Android and iOS implementations expose an `RNVPlugin` interface.
Your `react-native-video-custom-analytics` package should implement this interface and register itself as a plugin for `react-native-video`.

## Plugin Types

There are two types of plugins you can implement:

1. **Base Plugin (`RNVPlugin`)**: For general-purpose plugins that don't need specific player implementation details.
2. **Player-Specific Plugins**:
   - `RNVAVPlayerPlugin` for iOS: Provides type-safe access to AVPlayer instances
   - `RNVExoplayerPlugin` for Android: Provides type-safe access to ExoPlayer instances

Choose the appropriate plugin type based on your needs. If you need direct access to player-specific APIs, use the player-specific plugin classes.

## Android Implementation

### 1. Create the Plugin

You can implement either the base `RNVPlugin` interface or the player-specific `RNVExoplayerPlugin` interface.

#### Base Plugin

```kotlin
class MyAnalyticsPlugin : RNVPlugin {
    override fun onInstanceCreated(id: String, player: Any) {
        // Handle player creation
    }

    override fun onInstanceRemoved(id: String, player: Any) {
        // Handle player removal
    }
}
```

#### ExoPlayer-Specific Plugin

```kotlin
class MyExoPlayerAnalyticsPlugin : RNVExoplayerPlugin {
    override fun onInstanceCreated(id: String, player: ExoPlayer) {
        // Handle ExoPlayer creation with type-safe access
    }

    override fun onInstanceRemoved(id: String, player: ExoPlayer) {
        // Handle ExoPlayer removal with type-safe access
    }
}
```

The `RNVPlugin` interface defines two functions:

```kotlin
/**
 * Function called when a new player is created
 * @param id: a random string identifying the player
 * @param player: the instantiated player reference
 */
fun onInstanceCreated(id: String, player: Any)

/**
 * Function called when a player should be destroyed
 * when this callback is called, the plugin shall free all
 * resources and release all reference to Player object
 * @param id: a random string identifying the player
 * @param player: the player to release
 */
fun onInstanceRemoved(id: String, player: Any)
```

### 2. Register the Plugin

To register the plugin within the main `react-native-video` package, call:

```kotlin
ReactNativeVideoManager.getInstance().registerPlugin(plugin)
```

In the sample implementation, the plugin is registered in the `createNativeModules` entry point.

Once registered, your module can track player updates and report analytics data.

### Extending Core Functionality via Plugins

In addition to analytics, plugins can also be used to modify or override core behavior of `react-native-video`.

This allows native modules to deeply integrate with the playback system - for example:
- replacing the media source factory,
- modifying the media item before playback starts (e.g., injecting stream keys),
- disabling caching dynamically per source.

These capabilities are available through the advanced Android plugin interface: `RNVExoplayerPlugin`.

> ⚠️ These extension points are optional — if no plugin provides them, the player behaves exactly as it did before.

---

#### Plugin Extension Points (Android)

If your plugin implements `RNVExoplayerPlugin`, you can override the following methods:

##### 1. `overrideMediaItemBuilder`

Allows you to modify the `MediaItem.Builder` before it’s used. You can inject stream keys, cache keys, or override URIs.

```kotlin
override fun overrideMediaItemBuilder(
    source: Source,
    mediaItemBuilder: MediaItem.Builder
): MediaItem.Builder? {
    // Return modified builder or null to use default
}
```

##### 2. `overrideMediaDataSourceFactory`

Lets you replace the data source used by ExoPlayer. Useful for implementing read-only cache or request interception.

```kotlin
override fun overrideMediaDataSourceFactory(
    source: Source,
    mediaDataSourceFactory: DataSource.Factory
): DataSource.Factory? {
    // Return your custom factory or null to use default
}
```

##### 3. `shouldDisableCache`

Enables dynamic disabling of the caching system per source.

```kotlin
override fun shouldDisableCache(source: Source): Boolean {
    return true // your own logic
}
```

---

Once implemented, `react-native-video` will automatically invoke these methods for each `<Video />` instance.

## iOS Implementation

### 1. Podspec Integration

Your new module must have access to `react-native-video`. Add it as a dependency in your Podspec file:

```podfile
s.dependency "react-native-video"
```

### 2. Create the Plugin

You can implement either the base `RNVPlugin` class or the player-specific `RNVAVPlayerPlugin` class.

#### Base Plugin

```swift
class MyAnalyticsPlugin: RNVPlugin {
    override func onInstanceCreated(id: String, player: Any) {
        // Handle player creation
    }

    override func onInstanceRemoved(id: String, player: Any) {
        // Handle player removal
    }
}
```

#### AVPlayer-Specific Plugin

```swift
class MyAVPlayerAnalyticsPlugin: RNVAVPlayerPlugin {
    override func onInstanceCreated(id: String, player: AVPlayer) {
        // Handle AVPlayer creation with type-safe access
    }

    override func onInstanceRemoved(id: String, player: AVPlayer) {
        // Handle AVPlayer removal with type-safe access
    }

    /// Optionally override the asset used by the player before playback starts
    override func overridePlayerAsset(source: VideoSource, asset: AVAsset) async -> OverridePlayerAssetResult? {
        // Return a modified asset or nil to use the default
        return nil
    }
}
```

The `RNVAVPlayerPlugin` class defines several extension points:

```swift
/**
 * Function called when a new AVPlayer instance is created
 * @param id: a random string identifying the player
 * @param player: the instantiated AVPlayer
 */
open func onInstanceCreated(id: String, player: AVPlayer) { /* no-op */ }

/**
 * Function called when an AVPlayer instance is being removed
 * @param id: a random string identifying the player
 * @param player: the AVPlayer to release
 */
open func onInstanceRemoved(id: String, player: AVPlayer) { /* no-op */ }

/**
 * Optionally override the asset used by the player before playback starts.
 * Allows you to modify or replace the AVAsset before it is used to create the AVPlayerItem.
 * Return nil to use the default asset.
 *
 * @param source: The VideoSource describing the video (uri, type, headers, etc.)
 * @param asset: The AVAsset prepared by the player
 * @return: OverridePlayerAssetResult if you want to override, or nil to use the default
 */
open func overridePlayerAsset(source: VideoSource, asset: AVAsset) async -> OverridePlayerAssetResult? { nil }
```

##### `OverridePlayerAssetResult` and `OverridePlayerAssetType`

To override the asset, return an `OverridePlayerAssetResult`:

```swift
public struct OverridePlayerAssetResult {
  public let type: OverridePlayerAssetType
  public let asset: AVAsset

  public init(type: OverridePlayerAssetType, asset: AVAsset) {
    self.type = type
    self.asset = asset
  }
}

public enum OverridePlayerAssetType {
  case partial // Return a partially modified asset; will go through the default prepare process
  case full    // Return a fully modified asset; will skip the default prepare process
}
```

- Use `.partial` if you want the asset to continue through the player's normal preparation (e.g., for text tracks or metadata injection).
- Use `.full` if you want to provide a fully prepared asset that will be used as-is for playback.

**Example:**

```swift
override func overridePlayerAsset(source: VideoSource, asset: AVAsset) async -> OverridePlayerAssetResult? {
    // Example: Replace the asset URL
    let newAsset = AVAsset(url: URL(string: "https://example.com/override.mp4")!)
    return Result(type: .full, asset: newAsset)
}
```

> Only one plugin can override the player asset at a time. If multiple plugins implement this, only the first will be used.

### 3. Register the Plugin

To register the plugin in `react-native-video`, call:

```swift
ReactNativeVideoManager.shared.registerPlugin(plugin: plugin)
```

In the sample implementation, the plugin is registered inside the `VideoPluginSample` file within the `init` function:

```swift
import react_native_video

...

override init() {
    super.init()
    ReactNativeVideoManager.shared.registerPlugin(plugin: self)
}
```

Once registered, your module can track player updates and report analytics data to your backend.

## Custom DRM Manager

You can provide a custom DRM manager through your plugin to handle DRM in a custom way. This is useful when you need to integrate with a specific DRM provider or implement custom DRM logic.

### Android Implementation

#### 1/ Create custom DRM manager

Create a class that implements the `DRMManagerSpec` interface:

```kotlin
class CustomDRMManager : DRMManagerSpec {
    @Throws(UnsupportedDrmException::class)
    override fun buildDrmSessionManager(uuid: UUID, drmProps: DRMProps): DrmSessionManager? {
        // Your custom implementation for building DRM session manager
        // Return null if the DRM scheme is not supported
        // Throw UnsupportedDrmException if the DRM scheme is invalid
    }
}
```

#### 2/ Register DRM manager in your plugin

Implement `getDRMManager()` in your ExoPlayer plugin to provide the custom DRM manager:

```kotlin
class CustomVideoPlugin : RNVExoplayerPlugin {
    private val drmManager = CustomDRMManager()
    
    override fun getDRMManager(): DRMManagerSpec? {
        return drmManager
    }
    
    override fun onInstanceCreated(id: String, player: ExoPlayer) {
        // Handle player creation
    }
    
    override fun onInstanceRemoved(id: String, player: ExoPlayer) {
        // Handle player removal
    }
}
```

### iOS Implementation

#### 1/ Create custom DRM manager

Create a class that implements the `DRMManagerSpec` protocol:

```swift
class CustomDRMManager: NSObject, DRMManagerSpec {
    func createContentKeyRequest(
        asset: AVContentKeyRecipient,
        drmProps: DRMParams?,
        reactTag: NSNumber?,
        onVideoError: RCTDirectEventBlock?,
        onGetLicense: RCTDirectEventBlock?
    ) {
        // Initialize content key session and handle key request
    }
    
    func handleContentKeyRequest(keyRequest: AVContentKeyRequest) {
        // Process the content key request
    }
    
    func finishProcessingContentKeyRequest(keyRequest: AVContentKeyRequest, license: Data) throws {
        // Finish processing the key request with the obtained license
    }
    
    func handleError(_ error: Error, for keyRequest: AVContentKeyRequest) {
        // Handle any errors during the DRM process
    }
    
    func setJSLicenseResult(license: String, licenseUrl: String) {
        // Handle successful license acquisition from JS side
    }
    
    func setJSLicenseError(error: String, licenseUrl: String) {
        // Handle license acquisition errors from JS side
    }
}
```

#### 2/ Register DRM manager in your plugin

Implement `getDRMManager()` in your AVPlayer plugin to provide the custom DRM manager:

```swift
class CustomVideoPlugin: RNVAVPlayerPlugin {
    override func getDRMManager() -> DRMManagerSpec? {
        return CustomDRMManager()
    }
    
    override func onInstanceCreated(id: String, player: AVPlayer) {
        // Handle player creation
    }
    
    override func onInstanceRemoved(id: String, player: AVPlayer) {
        // Handle player removal
    }
}
```

### Important notes about DRM managers:

1. Only one plugin can provide a DRM manager at a time. If multiple plugins try to provide DRM managers, only the first one will be used.
2. The custom DRM manager will be used for all video instances in the app.
3. If no custom DRM manager is provided:
   - On iOS, the default FairPlay-based implementation will be used
   - On Android, the default ExoPlayer DRM implementation will be used
4. The DRM manager must handle all DRM-related functionality:
   - On iOS: key requests, license acquisition, and error handling through AVContentKeySession
   - On Android: DRM session management and license acquisition through ExoPlayer's DrmSessionManager
