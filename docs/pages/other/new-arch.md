# New Architecture

## Fabric

The library currently does not support Fabric. We are working on adding support. In the meantime, you can use the Interop Layer.

## Interop Layer

You can use this library with the New Architecture by enabling the Interop Layer.

### Requirements:
- `react-native` **>= 0.72.0**
- `react-native-video` **>= 6.0.0-beta.5**

For `react-native` versions **< 0.74**, you need to add the following configuration in the `react-native.config.js` file:

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

The library currently does not support Bridgeless Mode. We are working on adding support.
