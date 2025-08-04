---
title: Plugin Usage Examples
description: Simple examples of implementing common plugin scenarios for React Native Video
sidebar_position: 3
---

# Plugin Usage Examples

This document provides practical examples of implementing common plugin scenarios for React Native Video.

## Basic Plugin Template

```kotlin title="Android"
class MyPlugin : ReactNativeVideoPlugin("MyPlugin") {
    override fun onPlayerCreated(player: WeakReference<NativeVideoPlayer>) {
        Log.d("MyPlugin", "Player created with uri ${player.get()?.source.uri}")
    }
    
    override fun onPlayerDestroyed(player: WeakReference<NativeVideoPlayer>) {
        Log.d("MyPlugin", "Player destroyed")
    }
    
    override fun overrideSource(source: NativeVideoPlayerSource): NativeVideoPlayerSource {
        Log.d("MyPlugin", "Overriding source with uri ${source.uri}")
        return source
    }
}

// Usage
val plugin = MyPlugin() // Automatically registered
```

```swift title="iOS"
class MyPlugin: ReactNativeVideoPlugin {
    init() {
        super.init(name: "MyPlugin")
    }
    
    override func onPlayerCreated(player: Weak<NativeVideoPlayer>) {
        // Custom logic when player is created
    }
    
    override func onPlayerDestroyed(player: Weak<NativeVideoPlayer>) {
        // Custom cleanup when player is destroyed
    }
    
    override func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
        // Modify source if needed
        return source
    }
}

// Usage
let plugin = MyPlugin() // Automatically registered
```

## DRM Plugin

Implement custom DRM handling for protected content.

:::warning

DRM plugins are not supported yet in React Native Video. `getDRMManager` is not implemented yet and will have no effect.

:::

```kotlin title="Android"
class CustomDRMPlugin : ReactNativeVideoPlugin("CustomDRM") {
    override fun getDRMManager(source: NativeVideoPlayerSource): Any? {
        if (source.isDRMProtected() && source.drmType == "custom") {
            return CustomDRMManager(
                licenseUrl = source.drmLicenseUrl,
                certificateUrl = source.drmCertificateUrl,
                keyId = source.drmKeyId
            )
        }
        return null
    }
}
```

```swift title="iOS"
class CustomDRMPlugin: ReactNativeVideoPlugin {
    init() {
        super.init(name: "CustomDRM")
    }
    
    override func getDRMManager(source: NativeVideoPlayerSource) async -> Any? {
        guard source.isDRMProtected() && source.drmType == "custom" else {
            return nil
        }
        
        return CustomDRMManager(
            licenseUrl: source.drmLicenseUrl,
            certificateUrl: source.drmCertificateUrl,
            keyId: source.drmKeyId
        )
    }
}
```