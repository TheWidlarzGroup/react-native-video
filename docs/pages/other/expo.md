# Expo

## Expo plugin
From version `6.3.1`, we have added support for expo plugin. You can configure `react-native-video` properties in `app.config.js` file.
It's useful when you are using `expo` managed workflow (expo prebuild) as it will automatically configure `react-native-video` properties in native part of the expo project.

```javascript
// Use this import path - import from other place then lib folder will not work
import withVideo from 'react-native-video/lib/expo-plugins/withRNVideo';

const config = {
  // your app config
}

module.exports = withRNVideo(config, {
  // You can setup your react-native-video properties here
  enableNotificationControls: true,
  enableBackgroundAudio: true,
  enableCacheExtension: true,
  enableADSExtension: true,
  androidExtensions: {
    useExoplayerRtsp: true,
    useExoplayerSmoothStreaming: true,
    useExoplayerDash: true,
    useExoplayerHls: true,
  },
});
```

## Expo Plugin Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| enableNotificationControls | boolean | false | Add required changes on android to use notification controls for video player |
| enableBackgroundAudio | boolean | false | Add required changes to play video in background on iOS |
| enableADSExtension | boolean | false | Add required changes to use ads extension for video player |
| enableCacheExtension | boolean | false | Add required changes to use cache extension for video player on iOS |
| androidExtensions | object | {} | You can enable/disable extensions as per your requirement - this allow to reduce library size on android |