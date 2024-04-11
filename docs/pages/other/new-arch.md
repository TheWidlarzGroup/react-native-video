# New Architecture

## Fabric
Library currently does not support Fabric. We are working on it. In the meantime, you can use Interop Layer.

## Interop Layer
You can use this library on New Architecture by using Interop Layer. <br/> To use Interop Layer you need to have `react-native` >= `0.72.0` & `react-native-video` >= `6.0.0-beta.5`.

For `react-native` < `0.74` you need to add config in `react-native.config.js` file.

```javascript
module.exports = {
  project: {
    android: {
      unstable_reactLegacyComponentNames: ['Video'],
    },
    ios: {
      unstable_reactLegacyComponentNames: ['Video'],
    },
  },
};
```

## Bridgeless Mode
Library currently does not support Bridgeless Mode. We are working on it.
