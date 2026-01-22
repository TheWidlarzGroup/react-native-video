---
sidebar_position: 2
sidebar_label: Manual Configuration
description: Manual configuration of react-native-video
---

# Manual Configuration

If you prefer not to use the Expo plugin you can configure **react-native-video** manually by editing the native project files directly.  The steps below show the exact changes performed by the plugin so you can reproduce them in a plain React Native or bare Expo project.

---

## iOS

### Enable Background Audio
To allow video sound to continue when the app goes to the background add the `audio` mode to `Info.plist`:

```xml title="ios/YourApp/Info.plist"
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

## Android

### Configure ExoPlayer extensions
By default the library enables DASH & HLS extensions.  You can fine-tune this by adding properties to **gradle.properties**:

```properties title="android/gradle.properties"
# Enable / disable ExoPlayer extensions used by react-native-video
RNVideo_useExoplayerDash=true   # DASH playback support
RNVideo_useExoplayerHls=true    # HLS  playback support
```
Set a value to `false` to exclude the corresponding extension and reduce APK size.

### Enable Picture-in-Picture (PiP)
Add the `android:supportsPictureInPicture` flag to your *main* activity in **AndroidManifest.xml**:

```xml title="android/app/src/main/AndroidManifest.xml"
<application>
  <activity
    android:name=".MainActivity"
    android:supportsPictureInPicture="true"
    ...>
    <!-- other attributes -->
  </activity>
</application>
```

PiP requires **API 26+** (Android 8.0). Make sure `minSdkVersion` is at least `26` when enabling this feature.

## Verification
After the modifications:

1. **iOS** – run `cd ios && pod install` then build the app from Xcode or via `npx react-native run-ios` / `npx expo run:ios`.
2. **Android** – clean & rebuild the project: `./gradlew clean && ./gradlew :app:assembleDebug` or simply run `npx react-native run-android` / `npx expo run:android`.

If the build succeeds your manual configuration is complete.

---

### Need an easier way?
Use the [Expo plugin](./expo-plugin.md) to apply exactly the same changes automatically during `expo prebuild`.