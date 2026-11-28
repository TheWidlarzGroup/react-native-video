---
title: Configuration with Expo
sidebar_position: 1
sidebar_label: With Expo
description: Configure React Native Video with the Expo plugin — automatic native setup for iOS and Android with app.json config options.
keywords: [Expo, expo plugin, configuration, react native video, setup]
---

# Expo Plugin

The `react-native-video` library provides an Expo plugin to simplify the integration and configuration of specific features into your Expo project.

## Installation

To use the Expo plugin, you need to add it to your app's configuration file (`app.json` or `app.config.js`).

```json title="app.json"
{
  "expo": {
    "plugins": [
      [
        "react-native-video",
        {
          "enableAndroidPictureInPicture": true,
          "enableBackgroundAudio": true,
          "androidExtensions": {
            "useExoplayerDash": true,
            "useExoplayerHls": true
          }
        }
      ]
    ]
  }
}
```

```javascript title="app.config.js"
export default {
  plugins: [
    [
      'react-native-video',
      {
        enableAndroidPictureInPicture: true,
        enableBackgroundAudio: true,
        androidExtensions: {
          useExoplayerDash: true,
          useExoplayerHls: true,
        },
      },
    ],
  ],
};
```

## Configuration Options

The plugin accepts an optional configuration object with the following properties:

### `enableAndroidPictureInPicture` (optional)

-   **Type:** `boolean`
-   **Default:** `false`
-   **Description:** Enables Picture-in-Picture (PiP) mode on Android. This will apply the necessary configurations to your Android project.

### `enableBackgroundAudio` (optional)

-   **Type:** `boolean`
-   **Default:** `false`
-   **Description:** Adds the `audio` background mode to `UIBackgroundModes` in `Info.plist`, which iOS requires for audio to keep playing while the app is in the background. Android needs no project configuration for this: set `playInBackground` on the player, which uses the playback service the plugin always registers (see below).

### `androidExtensions` (optional)

-   **Type:** `object`
-   **Default:** `{ useExoplayerDash: true, useExoplayerHls: true }`
-   **Description:** Allows you to specify which Android ExoPlayer extensions to include. This can help reduce the size of your app by only including the extensions you need.
    -   `useExoplayerDash` (boolean, default: `true`): Whether to include ExoPlayer's Dash extension.
    -   `useExoplayerHls` (boolean, default: `true`): Whether to include ExoPlayer's HLS extension.

### `enableAndroidPlaybackService` (optional)

-   **Type:** `boolean`
-   **Default:** `true`
-   **Description:** Registers the Android playback service and the foreground service permissions it needs (see below). The player starts this service when `playInBackground` or `showNotificationControls` is enabled at runtime, so leave this on unless your app uses neither. Setting it to `false` keeps the two permissions out of your manifest, which also spares you the foreground service declaration in the Play Console.

### `reactNativeTestApp` (optional)

-   **Type:** `boolean`
-   **Default:** `false`
-   **Description:** Whether to use `react-native-test-app` compatible mode.

## What the plugin changes

### Android, unless `enableAndroidPlaybackService` is `false`

-   Registers `com.twg.video.core.services.playback.VideoPlaybackService` (a Media3 `MediaSessionService` with `android:foregroundServiceType="mediaPlayback"`) in `AndroidManifest.xml`.
-   Adds the `android.permission.FOREGROUND_SERVICE` and `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions.

The player starts this service at runtime when `playInBackground` or `showNotificationControls` is enabled, and neither is known at prebuild time, so the service and its permissions are added by default. If your app declares a foreground service type and targets Android 14 or newer, Google Play asks you to describe its use in the Play Console; an app that uses neither feature can opt out with `enableAndroidPlaybackService: false`.

### Android, per option

-   `enableAndroidPictureInPicture`: sets `android:supportsPictureInPicture="true"` on `.MainActivity`.
-   `androidExtensions`: writes `RNVideo_useExoplayerDash` and `RNVideo_useExoplayerHls` to `gradle.properties`. A key you leave out keeps its default (`true`).

### iOS

-   `enableBackgroundAudio`: adds `audio` to `UIBackgroundModes` in `Info.plist` (and removes it when set to `false`).

## Usage

Once configured in your `app.json` or `app.config.js`, the plugin will automatically apply the necessary native project changes during the prebuild process (e.g., when running `npx expo prebuild`). No further manual setup is typically required for these features. 