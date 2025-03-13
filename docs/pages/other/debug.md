# Debugging

This page provides useful tips for debugging and troubleshooting issues in the package or your application.

## Using the Sample App

This repository contains multiple sample implementations in the `example` folder. It is always preferable to test behavior in a sample app rather than in a full application. The basic sample allows testing of many features.

To use the sample app, follow these steps:

- Clone this repository:
  ```shell
  git clone git@github.com:TheWidlarzGroup/react-native-video.git
  ```
- Navigate to the root folder and build the package. This generates a transpiled version in the `lib` folder:
  ```shell
  cd react-native-video && yarn && yarn build
  ```
- Navigate to the sample app and install dependencies:
  ```shell
  cd example/basic && yarn install
  ```
- Build and run the app:
    - For Android:
      ```shell
      yarn android
      ```
    - For iOS:
      ```shell
      cd ios && pod install && cd .. && yarn ios
      ```

## HTTP Playback Doesn't Work or Black Screen on Release Build (Android)

If your video works in Debug mode but shows only a black screen in Release mode, check the URL of your video. If you are using the `http` protocol, you need to add the following line to your `AndroidManifest.xml` file. [More details here](https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic):

```xml
<application
 ...
 android:usesCleartextTraffic="true"
>
```

## Decoder Issue (Android)

Some devices have a maximum number of simultaneous video playbacks. If this limit is reached, ExoPlayer returns an error: `Unable to instantiate decoder`.

**Known issue:** This happens frequently in Debug mode.

## Unable to Play Clear Content (All OS)

Before opening a ticket, follow these steps:

### Check Remote File Access

Ensure you can download the manifest/content file using a browser.

### Check If Another Player Can Play the Content

Clear playback should work with any video player. Test the content with another player, such as [VLC](https://www.videolan.org/vlc/), to confirm it plays without issues.

## Unable to Play Protected Content (All OS)

### Protected Content Gives an Error (Token Error / Access Forbidden)

If the content requires an access token or HTTP headers, ensure you can access the data using `wget` or a REST client. Provide all necessary authentication parameters.

## Debugging Network Calls Not Visible in React Native Debugging Tools

This is a React Native limitation—React Native debugging tools only capture network calls made in JavaScript.

To debug network calls, use tools like:
- [Charles Proxy](https://www.charlesproxy.com/)
- [Fiddler](https://www.telerik.com/fiddler)

These tools allow you to sniff all HTTP/HTTPS calls, including access to content, DRM, and audio/video chunks. Compare the request/response patterns with previous tests to diagnose issues.

## Debugging Media3: Build from Media3 Source

If you need to use a specific ExoPlayer version or modify default behavior, you may need to build from the Media3 source code.

### Configure Player Path

Add the following lines to `settings.gradle` to configure your Media3 source path:

```gradle
gradle.ext.androidxMediaModulePrefix = 'media-'
apply from: file("../../../../media3/core_settings.gradle")
```

Replace this with the actual Media3 source path. Ensure that you use the same version (or a compatible API version) supported by the package.

### Enable Building from Source

In your `build.gradle` file, add the following setting:

```gradle
buildscript {
    ext {
        ...
        buildFromMedia3Source = true
        ...
    }
}
```

## Still Not Working?

You can open a ticket or contact us for [premium support](https://www.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs#Contact).

