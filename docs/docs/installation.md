---
sidebar_position: 2
description: React Native Video Installation Guide and Requirements
---
# Installation

React Native Video is a library that allows you to play various kind of videos in a React Native application. It is built on top of the [`react-native-nitro-modules`](https://nitro.margelo.com/docs/what-is-nitro) type-safe and extremely fast native modules framework. React Native Video supports both New Architecture and Old Architecture.

## Requirements

### System Requirements
- iOS `15.0` or higher
- Android `6.0` or higher

### Minimal Package Requirements
- `react-native` `0.75.0` or higher
- `react-native-nitro-modules` `0.26.0` or higher 

## Installation

1. Install dependencies:
```bash
npm install react-native-video@next react-native-nitro-modules
```

2. Configure Library:
You can configure the library in two ways:
- [Using expo plugins](./configuration/expo-plugin.md)
- [Manually editing needed files](./configuration/manual.md)

3. Run the project:
If you are using Expo, you will need to generate native files:
```bash
npx expo prebuild
```

And then run the project:
```bash
npx expo run:ios # run on iOS
npx expo run:android # run on Android
```

If you are using React Native CLI, you will need to install Pods for iOS:
```bash
cd ios && pod install && cd ..
```

And then run the project:
```bash
npx react-native run-ios # run on iOS
npx react-native run-android # run on Android
```

## Usage

```tsx title="App.tsx"
import { VideoView, useVideoPlayer } from 'react-native-video';

export default function App() {
  const player = useVideoPlayer({
    source: {
      uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  });

  return <VideoView player={player} />;
}
```