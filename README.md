## react-native-video

A `<Video>` component for react-native, as seen in
[react-native-login](https://github.com/brentvatne/react-native-login)!

Version 4.x requires react-native >= 0.57.0

Version 3.x requires react-native >= 0.40.0

### Version 4.0.0 breaking changes
Version 4.0.0 changes some behaviors and may require updates to your Gradle files.  See [Updating](#updating) for details.

Version 4.0.0 now requires Android target SDK 26+ and Gradle 3 plugin in order to support ExoPlayer 2.9.0. Google is dropping support for apps using target SDKs older than 26 as of October 2018 and Gradle 2 as of January 2019. React Native 0.57 defaults to Gradle 3 & SDK 27.

If you need to support an older React Native version, you should use react-native-video 3.2.1.

### Version 3.0.0 breaking changes
Version 3.0 features a number of changes to existing behavior. See [Updating](#updating) for changes.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [iOS App Transport Security](#ios-app-transport-security)
* [Audio Mixing](#audio-mixing)
* [Android Expansion File Usage](#android-expansion-file-usage)
* [Updating](#updating)

## Installation

Using npm:

```shell
npm install --save react-native-video
```

or using yarn:

```shell
yarn add react-native-video
```

Then follow the instructions for your platform to link react-native-video into your project:

<details>
  <summary>iOS</summary>

### Standard Method

Run `react-native link react-native-video` to link the react-native-video library.

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

</details>

<details>
  <summary>tvOS</summary>
  
`react-native link react-native-video` doesn’t work properly with the tvOS target so we need to add the library manually.

First select your project in Xcode.

<img src="./docs/tvOS-step-1.jpg" width="40%">

After that, select the tvOS target of your application and select « General » tab

<img src="./docs/tvOS-step-2.jpg" width="40%">

Scroll to « Linked Frameworks and Libraries » and tap on the + button

<img src="./docs/tvOS-step-3.jpg" width="40%">

Select RCTVideo-tvOS

<img src="./docs/tvOS-step-4.jpg" width="40%">
</details>

<details>
  <summary>Android</summary>

Run `react-native link react-native-video` to link the react-native-video library.

Or if you have trouble, make the following additions to the given files manually:

**android/settings.gradle**

The newer ExoPlayer library will work for most people.

```gradle
include ':react-native-video'
project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android-exoplayer')
```

If you need to use the old Android MediaPlayer based player, use the following instead:

```gradle
include ':react-native-video'
project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android')
```


**android/app/build.gradle**

```gradle
dependencies {
   ...
   compile project(':react-native-video')
}
```

**MainApplication.java**

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
</details>

<details>
  <summary>Windows</summary>

Make the following additions to the given files manually:

**windows/myapp.sln**

Add the `ReactNativeVideo` project to your solution.

1. Open the solution in Visual Studio 2015
2. Right-click Solution icon in Solution Explorer > Add > Existing Project
  * UWP: Select `node_modules\react-native-video\windows\ReactNativeVideo\ReactNativeVideo.csproj`
  * WPF: Select `node_modules\react-native-video\windows\ReactNativeVideo.Net46\ReactNativeVideo.Net46.csproj`

**windows/myapp/myapp.csproj**

Add a reference to `ReactNativeVideo` to your main application project. From Visual Studio 2015:

1. Right-click main application project > Add > Reference...
  * UWP: Check `ReactNativeVideo` from Solution Projects.
  * WPF: Check `ReactNativeVideo.Net46` from Solution Projects.

**MainPage.cs**

Add the `ReactVideoPackage` class to your list of exported packages.
```cs
using ReactNative;
using ReactNative.Modules.Core;
using ReactNative.Shell;
using ReactNativeVideo; // <-- Add this
using System.Collections.Generic;
...

        public override List<IReactPackage> Packages
        {
            get
            {
                return new List<IReactPackage>
                {
                    new MainReactPackage(),
                    new ReactVideoPackage(), // <-- Add this
                };
            }
        }

...
```
</details>

<details>
  <summary>react-native-dom</summary>

Make the following additions to the given files manually:

**dom/bootstrap.js**

Import RCTVideoManager and add it to the list of nativeModules:

```javascript
import { RNDomInstance } from "react-native-dom";
import { name as appName } from "../app.json";
import RCTVideoManager from 'react-native-video/dom/RCTVideoManager'; // Add this

// Path to RN Bundle Entrypoint ================================================
const rnBundlePath = "./entry.bundle?platform=dom&dev=true";

// React Native DOM Runtime Options =============================================
const ReactNativeDomOptions = {
  enableHotReload: false,
  nativeModules: [RCTVideoManager] // Add this
};
```
</details>

## Usage

```javascript
// Load the module

import Video from 'react-native-video';

// Within your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if you like.

<Video source={{uri: "background"}}   // Can be a URL or a local file.
       ref={(ref) => {
         this.player = ref
       }}                                      // Store reference
       onBuffer={this.onBuffer}                // Callback when remote video is buffering
       onError={this.videoError}               // Callback when video cannot be loaded
       style={styles.backgroundVideo} />

// Later on in your styles..
var styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
```

## Read the react-native-video [API documentation](docs/API.md) for more details about the JS API.

### iOS App Transport Security

- By default, iOS will only load encrypted (https) urls. If you want to load content from an unencrypted (http) source, you will need to modify your Info.plist file and add the following entry:

<img src="./docs/AppTransportSecuritySetting.png" width="50%">

For more detailed info check this [article](https://cocoacasts.com/how-to-add-app-transport-security-exception-domains)
</details>

### Audio Mixing

At some point in the future, react-native-video will include an Audio Manager for configuring how videos mix with other apps playing sounds on the device.

On iOS, if you would like to allow other apps to play music over your video component, make the following change:

**AppDelegate.m**

```objective-c
#import <AVFoundation/AVFoundation.h>  // import

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ...
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];  // allow
  ...
}
```

You can also use the [ignoreSilentSwitch](ignoresilentswitch) prop.
</details>

### Android Expansion File Usage
Expansions files allow you to ship assets that exceed the 100MB apk size limit and don't need to be updated each time you push an app update.

This only supports mp4 files and they must not be compressed. Example command line for preventing compression:
```bash
zip -r -n .mp4 *.mp4 player.video.example.com
```

```javascript
// Within your render function, assuming you have a file called
// "background.mp4" in your expansion file. Just add your main and (if applicable) patch version
<Video source={{uri: "background", mainVer: 1, patchVer: 0}} // Looks for .mp4 file (background.mp4) in the given expansion version.
       resizeMode="cover"           // Fill the whole screen at aspect ratio.
       style={styles.backgroundVideo} />

### Load files with the RN Asset System

The asset system [introduced in RN `0.14`](http://www.reactnative.com/react-native-v0-14-0-released/) allows loading image resources shared across iOS and Android without touching native code. As of RN `0.31` [the same is true](https://github.com/facebook/react-native/commit/91ff6868a554c4930fd5fda6ba8044dbd56c8374) of mp4 video assets for Android. As of [RN `0.33`](https://github.com/facebook/react-native/releases/tag/v0.33.0) iOS is also supported. Requires `react-native-video@0.9.0`.

```
<Video
  source={require('../assets/video/turntable.mp4')}
/>
```

### Play in background on iOS

To enable audio to play in background on iOS the audio session needs to be set to `AVAudioSessionCategoryPlayback`. See [Apple documentation][3] for additional details. (NOTE: there is now a ticket to [expose this as a prop]( https://github.com/react-native-community/react-native-video/issues/310) )

## Examples

- See an [Example integration][1] in `react-native-login` *note that this example uses an older version of this library, before we used `export default` -- if you use `require` you will need to do `require('react-native-video').default` as per instructions above.*
- Try the included [VideoPlayer example][2] yourself:

   ```sh
   git clone git@github.com:react-native-community/react-native-video.git
   cd react-native-video/example
   npm install
   open ios/VideoPlayer.xcodeproj

   ```

   Then `Cmd+R` to start the React Packager, build and run the project in the simulator.

- [Lumpen Radio](https://github.com/jhabdas/lumpen-radio) contains another example integration using local files and full screen background video.

## Updating

### Version 4.0.0

#### Gradle 3 and target SDK 26 requirement
In order to support ExoPlayer 2.9.0, you must use version 3 or higher of the Gradle plugin. This is included by default in React Native 0.57.

#### ExoPlayer 2.9.0 Java 1.8 requirement
ExoPlayer 2.9.0 uses some Java 1.8 features, so you may need to enable support for Java 1.8 in your app/build.gradle file. If you get an error, compiling with ExoPlayer like:
`Default interface methods are only supported starting with Android N (--min-api 24)`

Add the following to your app/build.gradle file:
```
android {
   ... // Various other settings go here
   compileOptions {
     targetCompatibility JavaVersion.VERSION_1_8
   }
}
```

#### ExoPlayer no longer detaches
When using a router like the react-navigation TabNavigator, switching between tab routes would previously cause ExoPlayer to detach causing the video player to pause. We now don't detach the view, allowing the video to continue playing in a background tab. This matches the behavior for iOS. Android MediaPlayer will crash if it detaches when switching routes, so its behavior has not been changed.

#### useTextureView now defaults to true
The SurfaceView, which ExoPlayer has been using by default has a number of quirks that people are unaware of and often cause issues. This includes not supporting animations or scaling. It also causes strange behavior if you overlay two videos on top of each other, because the SurfaceView will [punch a hole](https://developer.android.com/reference/android/view/SurfaceView) through other views. Since TextureView doesn't have these issues and behaves in the way most developers expect, it makes sense to make it the default.

TextureView is not as fast as SurfaceView, so you may still want to enable SurfaceView support. To do this, you can set `useTextureView={false}`.


### Version 3.0.0

#### All platforms now auto-play
Previously, on Android ExoPlayer if the paused prop was not set, the media would not automatically start playing. The only way it would work was if you set `paused={false}`. This has been changed to automatically play if paused is not set so that the behavior is consistent across platforms.

#### All platforms now keep their paused state when returning from the background
Previously, on Android MediaPlayer if you setup an AppState event when the app went into the background and set a paused prop so that when you returned to the app the video would be paused it would be ignored.

Note, Windows does not have a concept of an app going into the background, so this doesn't apply there.

#### Use Android target SDK 27 by default
Version 3.0 updates the Android build tools and SDK to version 27. React Native is in the process of [switchting over](https://github.com/facebook/react-native/issues/18095#issuecomment-395596130) to SDK 27 in preparation for Google's requirement that new Android apps [use SDK 26](https://android-developers.googleblog.com/2017/12/improving-app-security-and-performance.html) by August 2018.

You will either need to install the version 27 SDK and version 27.0.3 buildtools or modify your build.gradle file to configure react-native-video to use the same build settings as the rest of your app as described below.

##### Using app build settings
You will need to create a `project.ext` section in the top-level build.gradle file (not app/build.gradle). Fill in the values from the example below using the values found in your app/build.gradle file.
```
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ... // Various other settings go here
}

allprojects {
    ... // Various other settings go here

    project.ext {
        compileSdkVersion = 23
        buildToolsVersion = "23.0.1"

        minSdkVersion = 16
        targetSdkVersion = 22
    }
}
```

If you encounter an error `Could not find com.android.support:support-annotations:27.0.0.` reinstall your Android Support Repository.

## TODOS

- [ ] Add support for playing multiple videos in a sequence (will interfere with current `repeat` implementation)
- [x] Callback to get buffering progress for remote videos
- [ ] Bring API closer to HTML5 `<Video>` [reference](http://devdocs.io/html/element/video)

[1]: https://github.com/brentvatne/react-native-login/blob/56c47a5d1e23781e86e19b27e10427fd6391f666/App/Screens/UserInfoScreen.js#L32-L35
[2]: https://github.com/react-native-community/react-native-video/tree/master/example
[3]: https://developer.apple.com/library/ios/qa/qa1668/_index.html

---

**MIT Licensed**
