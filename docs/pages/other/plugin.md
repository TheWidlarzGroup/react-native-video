# Plugin (experimental)

Since Version 6.4.0, it is possible to create plugins for analytics management, DRM handling, and maybe much more.
A sample plugin is available in the repository in: example/react-native-video-plugin-sample. (important FIXME, put sample link)

## Concept

Most of the analytics system which tracks player information (bitrate, errors, ...) can be integrated directly with Exoplayer or AVPlayer handles.

This plugin system allows none intrusive integration of analytics and DRM handling in the react-native-package. It shall be done in native language (kotlin/swift).

The idea behind this system is to be able to plug an analytics package or custom DRM manager to react native video without doing any code change (ideally).

Following documentation will show on how to create a new plugin for react native video

## Warning and consideration
This is an experiental API, it is subject to change. The api with player is very simple but should be flexible enough to implement analytics system and DRM handling. If you need some metadata, you should implement setter in the new package you are creating.

As api is flexible, it makes possible to missuse the system. It is necessary to consider the player handle as read-only. If you modify player behavior, we cannot garanty the good behavior of react-native-video package.

## General

First you need to create a new react native package:
```shell
npx create-react-native-library@latest react-native-video-custom-analytics
```

Both Android and iOS implementations expose two interfaces:
- `RNVPlugin`: Base interface for all RNV plugins that doesn't have dependencies nor logic specific to any player
- Player-specific interfaces: `RNVExoplayerPlugin` (Android) and `RNVAVPlayerPlugin` (iOS) for plugins that need direct access to the specific player implementations

Your `react-native-video-custom-analytics` shall implement one of these interfaces and register itself as a plugin for react native video.

## Android

There is no special requirement for gradle file.
You need two mandatory actions to be able to receive player handle.

### 1/ Create the plugin

You have two options for implementing a plugin on Android:

#### Option 1: Basic Plugin (RNVPlugin)

For plugins that don't need Exoplayer-specific functionality, implement the `RNVPlugin` interface:

```kotlin
interface RNVPlugin {
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
}
```

#### Option 2: Exoplayer-specific Plugin (RNVExoplayerPlugin)

For plugins that need direct access to Exoplayer functionality, implement the `RNVExoplayerPlugin` interface:

```kotlin
interface RNVExoplayerPlugin : RNVPlugin {
    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return DRMManagerSpec implementation if plugin wants to handle DRM, null otherwise
     */
    fun getDRMManager(): DRMManagerSpec? = null

    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     * @note: This is helper that ensure that player is non null ExoPlayer
     */
    fun onInstanceCreated(id: String, player: ExoPlayer)

    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     * @note: This is helper that ensure that player is non null ExoPlayer
     */
    fun onInstanceRemoved(id: String, player: ExoPlayer)
}
```

The `RNVExoplayerPlugin` interface already implements the base `RNVPlugin` methods by providing type-safe wrappers that ensure you receive an ExoPlayer instance.

### 2/ Register the plugin

To register your plugin with the main react native video package, call the following function:

```kotlin
ReactNativeVideoManager.getInstance().registerPlugin(plugin)
```

The proposed integration registers the instantiated class in the `createNativeModules` entry point.

Your native module can now track Player updates directly from Player reference and report to backend.

## iOS

### 1/ podspec integration

Your new module should be able to access the react-native-video package, so you must declare it as a dependency of the new module you are creating.

```podfile
  s.dependency "react-native-video"
```

### 2/ Create the plugin

You have two options for implementing a plugin on iOS:

#### Option 1: Basic Plugin (RNVPlugin)

For plugins that don't need AVPlayer-specific functionality, extend the `RNVPlugin` class:

```swift
open class RNVPlugin: NSObject {
    /**
     * Function called when a new player is created
     * @param id: a random string identifying the player
     * @param player: the instantiated player reference
     */
    open func onInstanceCreated(id: String, player: Any) { /* no-op */ }
    
    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param id: a random string identifying the player
     * @param player: the player to release
     */
    open func onInstanceRemoved(id: String, player: Any) { /* no-op */ }
}
```

#### Option 2: AVPlayer-specific Plugin (RNVAVPlayerPlugin)

For plugins that need direct access to AVPlayer functionality, extend the `RNVAVPlayerPlugin` class:

```swift
open class RNVAVPlayerPlugin: RNVPlugin {
    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return: DRMManagerSpec type if plugin wants to handle DRM, nil otherwise
     */
    open func getDRMManager() -> DRMManagerSpec? { nil }
    
    /**
     * Function called when a new AVPlayer instance is created
     * @param id: a random string identifying the player
     * @param player: the instantiated AVPlayer
     * @note: This is helper that ensure that player is non null AVPlayer
     */
    open func onInstanceCreated(id: String, player: AVPlayer) { /* no-op */ }
    
    /**
     * Function called when a AVPlayer instance is being removed
     * @param id: a random string identifying the player
     * @param player: the AVPlayer to release
     * @note: This is helper that ensure that player is non null AVPlayer
     */
    open func onInstanceRemoved(id: String, player: AVPlayer) { /* no-op */ }
}
```

The `RNVAVPlayerPlugin` class already extends from the base `RNVPlugin` class and provides type-safe wrappers that ensure you receive an AVPlayer instance.

### 3/ Register the plugin

To register your plugin with the main react native video package, call this function:

```swift
ReactNativeVideoManager.shared.registerPlugin(plugin: plugin)
```

The proposed integration registers the instantiated class in file `VideoPluginSample` in the init function:

```swift
import react_native_video

...

override init() {
    super.init()
    ReactNativeVideoManager.shared.registerPlugin(plugin: self)
}
```

Your native module can now track Player updates directly from Player reference and report to backend.

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