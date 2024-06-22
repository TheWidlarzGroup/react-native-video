# Plugin (experimental)

Since Version 6.4.0, it is possible to create plugins for analytics management and maybe much more.
A sample plugin is available in the repository in: example/react-native-video-plugin-sample. (important FIXME, put sample link)

## Concept

Most of the analytics system which tracks player information (bitrate, errors, ...) can be integrated directly with Exoplayer or AVPlayer handles.

This plugin system allows none intrusive integration of analytics in the react-native-package. It shall be done in native language (kotlin/swift).

The idea behind this system is to be able to plug an analytics package to react native video without doing any code change (ideally).

Following documentation will show on how to create a new plugin for react native video

## Warning and consideration
This is an experiental API, it is subject to change. The api with player is very simple but should be flexible enough to implement analytics system. If you need some metadata, you should implement setter in the new package you are creating.

As api is flexible, it makes possible to missuse the system. It is necessary to consider the player handle as read-only. If you modify player behavior, we cannot garanty the good behavior of react-native-video package.

## General

First you need to create a new react native package:
````shell
npx create-react-native-library@latest react-native-video-custom-analytics
````

Both android and iOS implementation expose an interface `RNVPlugin`.
Your `react-native-video-custom-analytics` shall implement this interface and register itself as a plugin for react native video.

## Android
There is no special requierement for gradle file.
You need two mandatory action to be able to receive player handle

### 1/ Create the plugin

First you should instanciate a class which extends `RNVPlugin`.

The proposed integration implement `RNVPlugin` directly inside the Module file (`VideoPluginSampleModule`).

The `RNVPlugin` interface only defines 2 functions, see description here under.

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
 ````

### 2/ register the plugin

To register this allocated class in the main react native video package you should call following function:

```kotlin
ReactNativeVideoManager.getInstance().registerPlugin(plugin)
```
The proposed integration register the instanciated class in `createNativeModules` entry point.

Your native module can now track Player updates directly from Player reference and report to backend.

## ios

### 1/ podspec integration

Your new module shall be able to access to react-native-video package, then we must declare it as a dependency of the new module you are creating.

```podfile
  s.dependency "react-native-video"
````

### 2/ Create the plugin

First you should instanciate a class which extends `RNVPlugin`.

The proposed integration implement `RNVPlugin` directly inside the entry point of the module file (`VideoPluginSample`).

The `RNVPlugin` interface only defines 2 functions, see description here under.

```swift
    /**
     * Function called when a new player is created
     * @param player: the instantiated player reference
     */
    func onInstanceCreated(player: Any)
    /**
     * Function called when a player should be destroyed
     * when this callback is called, the plugin shall free all
     * resources and release all reference to Player object
     * @param player: the player to release
     */
    func onInstanceRemoved(player: Any)
```

### 3/ Register the plugin

To register this allocated class in the main react native video package you should register it by calling this function:

```swift
ReactNativeVideoManager.shared.registerPlugin(plugin: plugin)
```

The proposed integration register the instanciated class in file `VideoPluginSample` in the init function:

```swift
import react_native_video

...

override init() {
    super.init()
    ReactNativeVideoManager.shared.registerPlugin(plugin: self)
}
```

Your native module can now track Player updates directly from Player reference and report to backend.
