# Expo

## Expo Plugin

Starting from version `6.3.1`, `react-native-video` supports an Expo plugin. You can configure `react-native-video` properties in the `app.json`, `app.config.json`, or `app.config.js` file.

This is particularly useful when using the `Expo` managed workflow (`expo prebuild`), as it automatically sets up `react-native-video` properties in the native part of the Expo project.

### Example Configuration

```json
// app.json
{
  "name": "my app",
  "plugins": [
    [
      "react-native-video",
      {
        "enableNotificationControls": true,
        "androidExtensions": {
          "useExoplayerRtsp": false,
          "useExoplayerSmoothStreaming": false,
          "useExoplayerHls": false,
          "useExoplayerDash": false
        }
      }
    ]
  ]
}
```

## Expo Plugin Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| enableNotificationControls | boolean | false | Add required changes on android to use notification controls for video player |
| enableBackgroundAudio | boolean | false | Add required changes to play video in background on iOS |
| enableADSExtension | boolean | false | Add required changes to use ads extension for video player |
| enableCacheExtension | boolean | false | Add required changes to use cache extension for video player on iOS |
| androidExtensions | object | {} | You can enable/disable extensions as per your requirement - this allow to reduce library size on android |
| enableAndroidPictureInPicture | boolean | false | Apply configs to be able to use Picture-in-picture on android |
