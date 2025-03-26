# Installation

Using npm:

```shell
npm install --save react-native-video
```

or using yarn:

```shell
yarn add react-native-video
```

Then follow the instructions for your platform to link `react-native-video` into your project.

# Specific Platform Installation

<details>
<summary>iOS</summary>

## iOS

### Standard Method
Run `pod install` in the `ios` directory of your project.

⚠️ From version `6.0.0`, the minimum iOS version required is `13.0`. For more information, see the [updating section](updating.md).

### Enable Custom Features in the Podfile

Sample configurations are available in the sample app. See the [sample pod file](https://github.com/TheWidlarzGroup/react-native-video/blob/9c669a2d8a53df36773fd82ff0917280d0659bc7/examples/basic/ios/Podfile#L34).

#### Video Caching

To enable video caching, add the following line to your Podfile: ([more info here](other/caching.md))

```podfile
# Enable Video Caching
$RNVideoUseVideoCaching=true
```

#### Google IMA

Google IMA is the SDK for client-side ads integration. See the [Google documentation](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side) for more details.

To enable Google IMA, add the following line to your Podfile:

```podfile
$RNVideoUseGoogleIMA=true
```

**If you are using Expo, you can use the [Expo plugin](other/expo.md).**

</details>

<details>
<summary>Android</summary>

## Android

From version `>= 6.0.0`, your application must use Kotlin version `>= 1.8.0`.

```gradle
buildscript {
    ...
    ext.kotlinVersion = '1.8.0'
    ext.compileSdkVersion = 34
    ext.targetSdkVersion = 34
    ...
}
```

### Enable Custom Features in the Gradle File

**If you are using Expo, you can use the [Expo plugin](other/expo.md).**

You can enable or disable the following features by setting the corresponding variables in your `android/build.gradle` file:

- `useExoplayerIMA` - Enable Google IMA SDK (ads support)
- `useExoplayerRtsp` - Enable RTSP support
- `useExoplayerSmoothStreaming` - Enable SmoothStreaming support
- `useExoplayerDash` - Enable Dash support
- `useExoplayerHls` - Enable HLS support

Each enabled feature increases the APK size, so only enable what you need.

By default, the enabled features are:
- `useExoplayerSmoothStreaming`
- `useExoplayerDash`
- `useExoplayerHls`

Example:

```gradle
buildscript {
  ext {
    ...
    useExoplayerIMA = true
    useExoplayerRtsp = true
    useExoplayerSmoothStreaming = true
    useExoplayerDash = true
    useExoplayerHls = true
    ...
  }
}
```

See the [sample app](https://github.com/TheWidlarzGroup/react-native-video/blob/9c669a2d8a53df36773fd82ff0917280d0659bc7/examples/basic/android/build.gradle#L14C5-L14C5).

</details>

<details>
<summary>Windows</summary>

## Windows

### Autolinking

**React Native Windows 0.63 and above**

Autolinking should automatically add `react-native-video` to your app.

### Manual Linking

**React Native Windows 0.62**

Make the following manual additions:

#### `windows\myapp.sln`

Add the _ReactNativeVideoCPP_ project to your solution:

1. Open your solution in Visual Studio 2019.
2. Right-click the Solution icon in Solution Explorer > Add > Existing Project...
3. Select `node_modules\react-native-video\windows\ReactNativeVideoCPP\ReactNativeVideoCPP.vcxproj`.

#### `windows\myapp\myapp.vcxproj`

Add a reference to _ReactNativeVideoCPP_ to your main application project:

1. Open your solution in Visual Studio 2019.
2. Right-click the main application project > Add > Reference...
3. Check _ReactNativeVideoCPP_ from Solution Projects.

#### `pch.h`

Add:

```cpp
#include "winrt/ReactNativeVideoCPP.h"
```

#### `app.cpp`

Add:

```cpp
PackageProviders().Append(winrt::ReactNativeVideoCPP::ReactPackageProvider());
```

before `InitializeComponent();`.

**React Native Windows 0.61 and below**

Follow the manual linking steps for React Native Windows 0.62, but use _ReactNativeVideoCPP61_ instead of _ReactNativeVideoCPP_.

</details>

<details>
<summary>tvOS</summary>

## tvOS

`react-native link react-native-video` does not work properly with the tvOS target, so the library must be added manually.

### Steps:

1. Select your project in Xcode.

   ![tvOS step 1](../assets/tvOS-step-1.jpg)

2. Select the tvOS target of your application and open the "General" tab.

   ![tvOS step 2](../assets/tvOS-step-2.jpg)

3. Scroll to "Linked Frameworks and Libraries" and click the `+` button.

   ![tvOS step 3](../assets/tvOS-step-3.jpg)

4. Select `RCTVideo-tvOS`.

   ![tvOS step 4](../assets/tvOS-step-4.jpg)

</details>

<details>
<summary>visionOS</summary>

## visionOS

Run `pod install` in the `visionos` directory of your project.

</details>

<details>
<summary>Web</summary>

## Web

No additional setup is required. Everything should work out of the box.

However, only basic video support is available. HLS, Dash, ads, and DRM are not currently supported.

</details>
