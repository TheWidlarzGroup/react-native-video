# react-native-video

It's working both on New and Old Architecture.

## Requirements

- Please see [nitro requirements](https://nitro.margelo.com/docs/minimum-requirements)
- React Native 0.75 or higher

## Installation

You have to install `react-native-nitro-modules` (>=0.13.0) in your project.
```sh
npm install react-native-nitro-modules
```

Then install the package

> [NOTE]  
> This package is published on the private npm

```sh
npm install react-native-video
```

<details>
<summary>For react-native < 0.80</summary>
`react-native` < 0.80 have bug that prevents to properly handle errors by nitro modules on Android.
We highly recommend to apply bellow patch for `react-native-nitro-modules` to fix this issue.
You can apply it using `patch-package`.

Without this patch you won't be able "recognize" errors, all will be unknown errors.

```diff
diff --git a/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp b/node_modules/react-native-nitro-modules/cpp/core/HybridFunction.hpp
index aefd987..c2e06fb 100644
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
@@ -118,6 +122,10 @@ public:
         std::string funcName = getHybridFuncFullName<THybrid>(kind, name, hybridInstance.get());
         std::string message = exception.what();
         throw jsi::JSError(runtime, funcName + ": " + message);
+      } catch (const jni::JniException& exception) {
+        std::string funcName = getHybridFuncFullName<THybrid>(kind, name, hybridInstance.get());
+        std::string message = exception.what();
+        throw jsi::JSError(runtime, funcName + ": " + message);
 #pragma clang diagnostic pop
 #endif
       } catch (...) {
```
</details>

## Usage


```js
import * as React from 'react';
import { VideoView, useVideoPlayer } from "react-native-video";

const VideoPlayer = () => {

  const player = useVideoPlayer('https://www.w3schools.com/html/mov_bbb.mp4');

  // Methods
  player.play();
  player.pause();

  // Properties
  player.currentTime = 10;
  player.volume = 0.5;

  // Usage of VideoView
  return (
    <VideoView
      player={player}
      style={{ width: 300, height: 300 }}
    />
  );
};
```

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
