# React Native Video (Windows)

React Native Video is currently maintained for React Native Windows (RNW) >= 0.61.

There is one implementation of `react-native-video` in this folder:

1. _ReactNativeVideoCPP_ is the currently maintained implementation:
   1. Use _ReactNativeVideoCPP_ for RNW >= 0.62.
   2. Use _ReactNativeVideoCPP61_ for RNW 0.61.

# Local Development Setup (RNW >= 0.61)

In order to work on _ReactNativeVideoCPP_, you'll need to install the [Windows Development Dependencies](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies).

In addition, `react-native-video` targets React Native 0.61 and React Native Windows 0.61 as dev dependencies. So in order to build _ReactNativeVideoCPP_ locally against RNW > 0.61 you'll need to temporarily upgrade the development dependencies:

## RNW >= 0.63

```
npm install react-native@^0.63 --only=dev
npm install react-native-windows@^0.63 --only=dev
```

Now you should be able to open `ReactNativeVideoCPP.sln` in Visual Studio and build the project.

## RNW 0.62

```
npm install react-native@^0.62 --only=dev
npm install react-native-windows@^0.62 --only=dev
```

Now you should be able to open `ReactNativeVideoCPP62.sln` in Visual Studio and build the project.

## RNW 0.61

You should be able to open `ReactNativeVideoCPP61.sln` in Visual Studio and build the project.
