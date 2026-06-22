# Native platform setup (v6 & v7)

## iOS

- Run `cd ios && pod install` after installing.
- **HTTP (non-HTTPS) streams:** add an ATS exception in `Info.plist` (`NSAppTransportSecurity` → `NSAllowsArbitraryLoads`). HTTPS HLS needs nothing.
- **Background audio:** add `audio` to `UIBackgroundModes` (see `background-playback.md`).
- **PiP:** supported on iOS; combine with background audio mode.

## Android

- Autolinked. **DASH/HLS** ExoPlayer extensions are **enabled by default in v7** — set them to `false` only to slim the build:
  - v7 `gradle.properties`: `RNVideo_useExoplayerDash` / `RNVideo_useExoplayerHls` (default `true`; Expo: `androidExtensions`). (v6 may differ — check v6 docs.)
- **Cleartext HTTP:** add `android:usesCleartextTraffic="true"` to `<application>`.
- **Picture-in-Picture:** add `android:supportsPictureInPicture="true"` to the activity and use `minSdkVersion 26` (Expo: `enableAndroidPictureInPicture`).

## Expo

Use the config plugin in `app.json`/`app.config.js` and run `expo prebuild` (not Expo Go). v7 plugin options: `enableAndroidPictureInPicture`, `enableBackgroundAudio`, `androidExtensions: { useExoplayerDash, useExoplayerHls }`.

```json
{ "plugins": [["react-native-video", {
  "enableBackgroundAudio": true,
  "enableAndroidPictureInPicture": true
}]] }
```

> These steps are version-agnostic. Exact, current native config: v7 docs at https://docs.thewidlarzgroup.com/react-native-video/docs/v7/fundamentals/installation (v6 equivalents under https://docs.thewidlarzgroup.com/react-native-video/docs/v6/installation).
