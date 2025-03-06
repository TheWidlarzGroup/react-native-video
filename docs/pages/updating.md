# Updating

## Version 6.0.0

### iOS

#### Minimum iOS Version
Starting from version 6.0.0, the minimum supported iOS version is 13.0. Projects using `react-native < 0.73` must set the minimum iOS version to 13.0 in the Podfile.

You can do this by adding the following code to your Podfile:

```diff
- platform :ios, min_ios_version_supported

+ MIN_IOS_OVERRIDE = '13.0'
+ if Gem::Version.new(MIN_IOS_OVERRIDE) > Gem::Version.new(min_ios_version_supported)
+   min_ios_version_supported = MIN_IOS_OVERRIDE
+ end
```

#### Linking
In your project's Podfile, add support for static dependency linking. This is required to support the new Promises subdependency in the iOS Swift conversion.

Add `use_frameworks! :linkage => :static` right below `platform :ios` in your iOS project Podfile.

[See the example iOS project for reference](https://github.com/TheWidlarzGroup/react-native-video/blob/master/examples/basic/ios/Podfile#L5).

#### Podspec

You can remove the following lines from your Podfile as they are no longer needed:

```diff
-  `pod 'react-native-video', :path => '../node_modules/react-native-video/react-native-video.podspec'`

-  `pod 'react-native-video/VideoCaching', :path => '../node_modules/react-native-video/react-native-video.podspec'`
```

If you were previously using VideoCaching, you should set the `$RNVideoUseVideoCaching` flag in your Podspec. See the [installation section](https://docs.thewidlarzgroup.com/react-native-video/installation#video-caching) for details.

### Android

If you were using ExoPlayer on V5, remove the patch from **android/settings.gradle**:

```diff
- include ':react-native-video'
- project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android-exoplayer')
```

#### Using App Build Settings
You need to create a `project.ext` section in the top-level `build.gradle` file (not `app/build.gradle`). Fill in the values from the example below using the ones found in your `app/build.gradle` file.

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

If you encounter the error `Could not find com.android.support:support-annotations:27.0.0.`, reinstall your Android Support Repository.
