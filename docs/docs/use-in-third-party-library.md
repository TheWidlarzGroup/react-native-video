---
title: Use in Third Party Library
description: How to use React Native Video in a third party library
sidebar_position: 8
---

# Use in Third Party Library

You can use React Native Video in your third party library either as a dependency if you want to have specific version of the library or as a peer dependency if you want to version selection to be handled by the consumer of the library.

## In JS

Add `react-native-video` as a dependency or peer dependency.

```json title="package.json"
{
  "dependencies": {
    "react-native-video": "latest"
  }
  // OR
  "peerDependencies": {
    "react-native-video": "*"
  }
}
```

And then you can import it in your code.

```ts
import { VideoPlayer } from 'react-native-video';

const player = new VideoPlayer({ uri: 'https://www.example.com/video.mp4' });

player.play();
```

## In Native

### iOS
Add `ReactNativeVideo` as a dependency in your `*.podspec` file.

```ruby title="*.podspec"
Pod::Spec.new do |s|
  // ...

  s.dependency 'ReactNativeVideo'
end
```

### Android

Add `:react-native-video` and `:react-native-nitro-modules` as a dependency in your `build.gradle` file. Also you will need to add `androidx.media3` dependencies. to use player and source in your library.

```groovy title="build.gradle"
// ...

dependencies {
  // ...

  implementation project(':react-native-video')
  implementation project(':react-native-nitro-modules')

  implementation "androidx.media3:media3-common:1.4.1"
  implementation "androidx.media3:media3-exoplayer:1.4.1"
}
```

