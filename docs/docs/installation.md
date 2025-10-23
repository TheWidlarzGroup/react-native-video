---
sidebar_position: 2
description: React Native Video Installation Guide and Requirements
---
# Installation

React Native Video is a library that allows you to play various kinds of video in a React Native application. It is built on top of the [`react-native-nitro-modules`](https://nitro.margelo.com/docs/what-is-nitro) framework, giving it type-safety and blazing fast communication across Native and JavaScript threads. React Native Video supports both the New Architecture and the Old Architecture.

## Requirements

### System Requirements
- iOS `15.0` or higher
- Android `6.0` or higher

### Minimal Package Requirements
- `react-native` `0.75.0` or higher
- `react-native-nitro-modules` `0.27.2` or higher 

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

## Patch for react-native < 0.80

Versions of `react-native` < 0.80 have a bug that prevents them from properly handling errors thrown by nitro modules on Android.
If working with these versions of `react-native`, we highly recommend you apply the `react-native-nitro-modules` patch below, to fix this issue.
You can apply it using `patch-package`.

:::warning
Without this patch you won't be able "recognize" errors, all will be thrown as unknown errors.
:::

<details>
  <summary>For `react-native-nitro-modules` 0.27.X or higher</summary>

  ```diff
  diff --git a/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp b/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp
  index efcea05..ffad3f2 100644
  --- a/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp
  +++ b/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp
  @@ -23,6 +23,10 @@ struct JSIConverter;
  #include <string>
  #include <type_traits>

  +#ifdef ANDROID
  +#include <fbjni/fbjni.h>
  +#endif
  +
  namespace margelo::nitro {

  using namespace facebook;
  @@ -109,6 +113,15 @@ public:
          std::string funcName = getHybridFuncFullName<THybrid>(kind, name, hybridInstance.get());
          std::string message = exception.what();
          throw jsi::JSError(runtime, funcName + ": " + message);
  +#ifdef ANDROID
  +#pragma clang diagnostic push
  +#pragma clang diagnostic ignored "-Wexceptions"
  +      } catch (const jni::JniException& exception) {
  +        std::string funcName = getHybridFuncFullName<THybrid>(kind, name, hybridInstance.get());
  +        std::string message = exception.what();
  +        throw jsi::JSError(runtime, funcName + ": " + message);
  +#pragma clang diagnostic pop
  +#endif
        } catch (...) {
          // Some unknown exception was thrown - add method name information and re-throw as `JSError`.
          std::string funcName = getHybridFuncFullName<THybrid>(kind, name, hybridInstance.get());
  ```

  see [raw](https://github.com/TheWidlarzGroup/react-native-video/blob/v7/example/patches/react-native-nitro-modules%2B0.27.2.patch)
</details>


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