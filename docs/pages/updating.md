# Updating

### Version 6.0.0

#### iOS

In your project Podfile add support for static dependency linking. This is required to support the new Promises subdependency in the iOS swift conversion.

Add `use_frameworks! :linkage => :static` just under `platform :ios` in your ios project Podfile.

[See the example ios project for reference](examples/basic/ios/Podfile#L5)

### Version 5.0.0

Probably you want to update your gradle version:
#### gradle-wrapper.properties
```diff
- distributionUrl=https\://services.gradle.org/distributions/gradle-3.3-all.zip
+ distributionUrl=https\://services.gradle.org/distributions/gradle-5.1.1-all.zip
```

#### **android/app/build.gradle**

From version >= 5.0.0, you have to apply this changes:

```diff
dependencies {
   ...
    compile project(':react-native-video')
+   implementation "androidx.appcompat:appcompat:1.0.0"
-   implementation "com.android.support:appcompat-v7:${rootProject.ext.supportLibVersion}"

}
```

#### **android/gradle.properties**

Migrating to AndroidX (needs version >= 5.0.0):

```groovy
android.useAndroidX=true
android.enableJetifier=true
```

### Version 4.0.0

#### Gradle 3 and target SDK 26 requirement
In order to support ExoPlayer 2.9.0, you must use version 3 or higher of the Gradle plugin. This is included by default in React Native 0.57.

#### ExoPlayer 2.9.0 Java 1.8 requirement
ExoPlayer 2.9.0 uses some Java 1.8 features, so you may need to enable support for Java 1.8 in your app/build.gradle file. If you get an error, compiling with ExoPlayer like:
`Default interface methods are only supported starting with Android N (--min-api 24)`

Add the following to your app/build.gradle file:
```groovy
android {
   ... // Various other settings go here
   compileOptions {
     targetCompatibility JavaVersion.VERSION_1_8
   }
}
```

#### ExoPlayer no longer detaches
When using a router like the react-navigation TabNavigator, switching between tab routes would previously cause ExoPlayer to detach causing the video player to pause. We now don't detach the view, allowing the video to continue playing in a background tab. This matches the behavior for iOS.

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
Version 3.0 updates the Android build tools and SDK to version 27. React Native is in the process of [switching over](https://github.com/facebook/react-native/issues/18095#issuecomment-395596130) to SDK 27 in preparation for Google's requirement that new Android apps [use SDK 26](https://android-developers.googleblog.com/2017/12/improving-app-security-and-performance.html) by August 2018.

You will either need to install the version 27 SDK and version 27.0.3 buildtools or modify your build.gradle file to configure react-native-video to use the same build settings as the rest of your app as described below.

##### Using app build settings
You will need to create a `project.ext` section in the top-level build.gradle file (not app/build.gradle). Fill in the values from the example below using the values found in your app/build.gradle file.
```groovy
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ... // Various other settings go here
}

allprojects {
    ... // Various other settings go here

    project.ext {
        compileSdkVersion = 31
        buildToolsVersion = "30.0.2"

        minSdkVersion = 21
        targetSdkVersion = 22
    }
}
```
If you encounter an error `Could not find com.android.support:support-annotations:27.0.0.` reinstall your Android Support Repository.