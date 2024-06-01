# Updating

### Version 6.0.0

#### iOS

##### Min iOS version
From version 6.0.0, the minimum iOS version supported is 13.0. Projects that are using `react-native < 0.73` will need to set the minimum iOS version to 13.0 in the Podfile.

You can do it by adding the following code to your Podfile:
```diff
- platform :ios, min_ios_version_supported

+ MIN_IOS_OVERRIDE = '13.0'
+ if Gem::Version.new(MIN_IOS_OVERRIDE) > Gem::Version.new(min_ios_version_supported)
+   min_ios_version_supported = MIN_IOS_OVERRIDE
+ end
```

##### linking
In your project Podfile add support for static dependency linking. This is required to support the new Promises subdependency in the iOS swift conversion.

Add `use_frameworks! :linkage => :static` just under `platform :ios` in your ios project Podfile.

[See the example ios project for reference](examples/basic/ios/Podfile#L5)

##### podspec

You can remove following lines from your podfile as they are not necessary anymore

```diff
-  `pod 'react-native-video', :path => '../node_modules/react-native-video/react-native-video.podspec'`

-  `pod 'react-native-video/VideoCaching', :path => '../node_modules/react-native-video/react-native-video.podspec'`
```

If you were previously using VideoCaching, you should $RNVideoUseVideoCaching flag in your podspec, see: [installation section](https://react-native-video.github.io/react-native-video/installation#video-caching)

#### Android

If you are already using Exoplayer on V5, you should remove the patch done from **android/settings.gradle**

```diff
- include ':react-native-video'
- project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android-exoplayer')
``````

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