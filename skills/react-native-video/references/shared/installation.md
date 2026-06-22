# Installation (v6 & v7)

## v7

```sh
npm install react-native-video react-native-nitro-modules
cd ios && pod install
```

- React Native **≥ 0.75**; `react-native-nitro-modules` is a required peer dep.
- iOS **15.0+**, Android **minSdkVersion 24**.
- RN **< 0.80** on Android: a small `react-native-nitro-modules` patch is recommended so errors are surfaced instead of thrown as unknown (see the v7 install docs).
- Works on New and Old Architecture.

## v6

```sh
npm install react-native-video
cd ios && pod install
```

- iOS deployment target **13.0+**, Android Kotlin **≥ 1.8.0**.
- New Architecture works via the **interop layer** (RN ≥ 0.72). Below RN 0.74 you must register `Video` as a legacy component (`unstable_reactLegacyComponentNames: ['Video']`) in `react-native.config.js` — see https://docs.thewidlarzgroup.com/react-native-video/docs/v6/other/new-arch

## Expo (both)

Use the config plugin with `expo prebuild` (not Expo Go). v7's plugin accepts options like `enableAndroidPictureInPicture`, `enableBackgroundAudio`, and `androidExtensions` (DASH/HLS). See `platform-setup.md`.

> Full, version-correct install steps: v7 → https://docs.thewidlarzgroup.com/react-native-video/docs/v7/fundamentals/installation , v6 → https://docs.thewidlarzgroup.com/react-native-video/docs/v6/installation
