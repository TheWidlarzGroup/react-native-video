

# Installation
Using npm:

```shell
npm install --save react-native-video
```

or using yarn:

```shell
yarn add react-native-video
```

Then follow the instructions for your platform to link react-native-video into your project

# Specific platform installation
<details>
<summary>iOS</summary>

## iOS

### Standard Method

### Enable Static Linking for dependencies in your ios project Podfile

Add `use_frameworks! :linkage => :static` just under `platform :ios` in your ios project Podfile.

[See the example ios project for reference](https://github.com/react-native-video/react-native-video/blob/9c669a2d8a53df36773fd82ff0917280d0659bc7/examples/basic/ios/Podfile#L31C38-L31C38)

### Enable custom feature in podfile file

Samples available in sample app see [sample pod file](https://github.com/react-native-video/react-native-video/blob/9c669a2d8a53df36773fd82ff0917280d0659bc7/examples/basic/ios/Podfile#L34)

#### Video caching

To enable Video caching usage, add following line in your podfile:
([more info here](other/caching.md))

```podfile
# enable Video caching
+ $RNVideoUseVideoCaching=true
```

#### Google IMA

Google IMA is the google SDK to support Client Side Ads Integration (CSAI), see [google documentation](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side) for more information.

To enable google IMA usage define add following line in your podfile:
```podfile
$RNVideoUseGoogleIMA=true
```

</details>
<details>
<summary>Android</summary>

## Android

From version >= 6.0.0, your application needs to have kotlin version >= 1.7.0

```:
buildscript {
    ...
    ext.kotlinVersion = '1.7.0'
    ...
}
```

### Enable custom feature in gradle file

#### Enable client side ads insertion
To enable client side ads insertion CSAI with google IMA SDK, you need to enable it in your gradle file.

```gradle
buildscript {
  ext {
    ...
    RNVUseExoplayerIMA = true
    ...
  }
}
```

See [sample app](https://github.com/react-native-video/react-native-video/blob/9c669a2d8a53df36773fd82ff0917280d0659bc7/examples/basic/android/build.gradle#L14C5-L14C5)

</details>
<details>
<summary>Windows</summary>

## Windows

### Autolinking

**React Native Windows 0.63 and above**

Autolinking should automatically add react-native-video to your app.

### Manual Linking

**React Native Windows 0.62**

Make the following additions to the given files manually:

`windows\myapp.sln`

Add the _ReactNativeVideoCPP_ project to your solution (eg. `windows\myapp.sln`):

1. Open your solution in Visual Studio 2019
2. Right-click Solution icon in Solution Explorer > Add > Existing Project...
3. Select `node_modules\react-native-video\windows\ReactNativeVideoCPP\ReactNativeVideoCPP.vcxproj`

`windows\myapp\myapp.vcxproj`

Add a reference to _ReactNativeVideoCPP_ to your main application project (eg. `windows\myapp\myapp.vcxproj`):

1. Open your solution in Visual Studio 2019
2. Right-click main application project > Add > Reference...
3. Check _ReactNativeVideoCPP_ from Solution Projects

`pch.h`

Add `#include "winrt/ReactNativeVideoCPP.h"`.

`app.cpp`

Add `PackageProviders().Append(winrt::ReactNativeVideoCPP::ReactPackageProvider());` before `InitializeComponent();`.

**React Native Windows 0.61 and below**

Follow the manual linking instructions for React Native Windows 0.62 above, but substitute _ReactNativeVideoCPP61_ for _ReactNativeVideoCPP_.

</details>
<details>
<summary>tvOS</summary>

## tvOS

`react-native link react-native-video` doesn’t work properly with the tvOS target so we need to add the library manually.

First select your project in Xcode.

![tvOS step 1](../assets/tvOS-step-1.jpg)

After that, select the tvOS target of your application and select « General » tab

![tvOS step 2](../assets/tvOS-step-2.jpg)

Scroll to « Linked Frameworks and Libraries » and tap on the + button

![tvOS step 3](../assets/tvOS-step-3.jpg)

Select RCTVideo-tvOS

![tvOS step 4](../assets/tvOS-step-4.jpg)
</details>
</details>

## Examples

Run `yarn xbasic install` in the root directory before running any of the examples.

### iOS Example
```bash
yarn xbasic ios
```

### Android Example
```bash
yarn xbasic android
```

### Windows Example
```bash
yarn xbasic windows
```

