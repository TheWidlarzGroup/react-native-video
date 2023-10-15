

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

**React Native 0.60 and above**

Run `npx pod-install`. Linking is not required in React Native 0.60 and above.

**React Native 0.59 and below**

Run `react-native link react-native-video` to link the react-native-video library.

### Enable Static Linking for dependencies in your ios project Podfile

Add `use_frameworks! :linkage => :static` just under `platform :ios` in your ios project Podfile.

[See the example ios project for reference](examples/basic/ios/Podfile#L5)

### Using CocoaPods (required to enable caching)

Setup your Podfile like it is described in the [react-native documentation](https://facebook.github.io/react-native/docs/integration-with-existing-apps#configuring-cocoapods-dependencies). 

Depending on your requirements you have to choose between the two possible subpodspecs:

Video only:

```diff
  pod 'Folly', :podspec => '../node_modules/react-native/third-party-podspecs/Folly.podspec'
+  `pod 'react-native-video', :path => '../node_modules/react-native-video/react-native-video.podspec'`
  end
```

Video with caching ([more info](docs/caching.md)):

```diff
  pod 'Folly', :podspec => '../node_modules/react-native/third-party-podspecs/Folly.podspec'
+  `pod 'react-native-video/VideoCaching', :path => '../node_modules/react-native-video/react-native-video.podspec'`
  end
```
### Enable custom feature in podfile file

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

### Autolinking

Linking is not required in React Native 0.60 and above.

If your project is using React Native < 0.60, run `react-native link react-native-video` to link the react-native-video library.

If you have trouble, make the following additions to the given files manually:

`android/settings.gradle`

Add player source in build configuration

```gradle
include ':react-native-video'
project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android')
```

`android/app/build.gradle`

From version >= 5.0.0, you have to apply these changes:

```diff
dependencies {
   ...
    compile project(':react-native-video')
+   implementation "androidx.appcompat:appcompat:1.0.0"
-   implementation "com.android.support:appcompat-v7:${rootProject.ext.supportLibVersion}"

}
```

`android/gradle.properties`

Migrating to AndroidX (needs version >= 5.0.0):

```gradle.properties
android.useAndroidX=true
android.enableJetifier=true
```

`MainApplication.java`

If using com.facebook.react.PackageList to auto import native dependencies, there are no updates required here. Please see the [android example project](/examples/basic/android/app/src/main/java/com/videoplayer/MainApplication.java) for more details.

### For manual linking

On top, where imports are:

```java
import com.brentvatne.react.ReactVideoPackage;
```

Add the `ReactVideoPackage` class to your list of exported packages.

```java
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.asList(
            new MainReactPackage(),
            new ReactVideoPackage()
    );
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

