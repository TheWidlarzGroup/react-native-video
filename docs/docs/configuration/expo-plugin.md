---
sidebar_position: 1
sidebar_label: Expo Plugin
description: Expo plugin for react-native-video configuration
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
-   **Description:** Enables audio playback to continue when the app is in the background on Android. Ensure you have also configured the necessary background modes capabilities in your app if required by the operating system.

### `androidExtensions` (optional)

-   **Type:** `object`
-   **Default:** `{ useExoplayerDash: true, useExoplayerHls: true }`
-   **Description:** Allows you to specify which Android ExoPlayer extensions to include. This can help reduce the size of your app by only including the extensions you need.
    -   `useExoplayerDash` (boolean, default: `true`): Whether to include ExoPlayer's Dash extension.
    -   `useExoplayerHls` (boolean, default: `true`): Whether to include ExoPlayer's HLS extension.

### `reactNativeTestApp` (optional)

-   **Type:** `boolean`
-   **Default:** `false`
-   **Description:** Whether to use `react-native-test-app` compatible mode.

## Usage

Once configured in your `app.json` or `app.config.js`, the plugin will automatically apply the necessary native project changes during the prebuild process (e.g., when running `npx expo prebuild`). No further manual setup is typically required for these features. 