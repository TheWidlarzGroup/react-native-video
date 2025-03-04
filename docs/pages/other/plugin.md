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

## Android Implementation

### 1. Create the Plugin

First, instantiate a class that extends `RNVPlugin`.

The recommended approach is to implement `RNVPlugin` inside the Module file (`VideoPluginSampleModule`).

The `RNVPlugin` interface defines two functions:

```kotlin
/**
 * Called when a new player instance is created.
 * @param id: A unique identifier for the player instance.
 * @param player: The instantiated player reference.
 */
fun onInstanceCreated(id: String, player: Any)

/**
 * Called when a player instance should be destroyed.
 * The plugin should free resources and release all references to the player object.
 * @param id: A unique identifier for the player instance.
 * @param player: The player to release.
 */
fun onInstanceRemoved(id: String, player: Any)
```

### 2. Register the Plugin

To register the plugin within the main `react-native-video` package, call:

To register your plugin with the main react native video package, call the following function:

```kotlin
ReactNativeVideoManager.getInstance().registerPlugin(plugin)
```

In the sample implementation, the plugin is registered in the `createNativeModules` entry point.

Once registered, your module can track player updates and report analytics data.

## iOS Implementation

### 1. Podspec Integration

Your new module must have access to `react-native-video`. Add it as a dependency in your Podspec file:

```podfile
s.dependency "react-native-video"
```

### 2. Create the Plugin

Instantiate a class that extends `RNVPlugin`.

The recommended approach is to implement `RNVPlugin` inside the entry point module file (`VideoPluginSample`).

The `RNVPlugin` interface defines two functions:

```swift
/**
 * Called when a new player instance is created.
 * @param player: The instantiated player reference.
 */
func onInstanceCreated(player: Any)

/**
 * Called when a player instance should be destroyed.
 * The plugin should free resources and release all references to the player object.
 * @param player: The player to release.
 */
func onInstanceRemoved(player: Any)
```

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

Implement `getDRMManager()` in your plugin to provide the custom DRM manager:

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

Implement `getDRMManager()` in your plugin to provide the custom DRM manager:

```swift
class CustomVideoPlugin: RNVAVPlayerPlugin {
    override func getDRMManager() -> DRMManagerSpec? {
        return CustomDRMManager.self
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