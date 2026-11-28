---
title: Manual Configuration without Expo
sidebar_position: 2
sidebar_label: Without Expo
description: Manually configure React Native Video in a bare React Native project — iOS and Android native setup without the Expo plugin.
keywords: [manual configuration, bare React Native, iOS setup, Android setup, native config, react native video]
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

### Register the playback service (background playback and notification controls)
`playInBackground` and `showNotificationControls` run playback through a foreground service, `VideoPlaybackService`. The library's own manifest only declares `INTERNET`, so add the service and the two permissions it needs to your app's manifest. This is what the Expo plugin's `enableAndroidPlaybackService` option does.

```xml title="android/app/src/main/AndroidManifest.xml"
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

  <application>
    <!-- other entries -->
    <service
      android:name="com.twg.video.core.services.playback.VideoPlaybackService"
      android:exported="false"
      android:foregroundServiceType="mediaPlayback">
      <intent-filter>
        <action android:name="androidx.media3.session.MediaSessionService" />
      </intent-filter>
    </service>
  </application>
</manifest>
```

Without these entries the lock screen and notification controls never appear, and background playback isn't kept alive. If your app targets Android 14 or newer, Google Play asks you to describe the media-playback foreground service in the Play Console. If your app uses neither feature, skip this section.

## Verification
After the modifications:

1. **iOS** – run `cd ios && pod install` then build the app from Xcode or via `npx react-native run-ios` / `npx expo run:ios`.
2. **Android** – clean & rebuild the project: `./gradlew clean && ./gradlew :app:assembleDebug` or simply run `npx react-native run-android` / `npx expo run:android`.

If the build succeeds your manual configuration is complete.

---

### Need an easier way?
Use the [Expo plugin](./with-expo.md) to apply exactly the same changes automatically during `expo prebuild`.