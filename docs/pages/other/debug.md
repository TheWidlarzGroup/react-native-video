# Debugging

This page describe useful tips for debugging and investigating issue in the package or in your application.

## Using the sample app
This repository contains multiple a sample implementation in example folder.
It is always preferable to test behavior on a sample app than in a full app implementation.
The basic sample allow to test a lot of feature.
To use the sample you will need to do steps:
- Clone this repository:  ``` git clone git@github.com:TheWidlarzGroup/react-native-video.git```
- Go to root folder and build it. It will generate a transpiled version of the package in lib folder: ```cd react-native-video && yarn && yarn build```
- Go to the sample and install it: ```cd example/basic && yarn install```
- Build it ! for android ```yarn android``` for ios ```cd ios && pod install && cd .. && yarn ios``` 


## HTTP playback doesn't work or  Black Screen on Release build (Android)
If your video work on Debug mode, but on Release you see only black screen, please, check the link to your video. If you use 'http' protocol there, you will need to add next string to your AndroidManifest.xml file. [Details here](https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic)

```xml
<application
 ...
 android:usesCleartextTraffic="true"
>
```

## Decoder Issue (Android)

Devices have a maximum of simultaneous possible playback. It means you have reach this limit. Exoplayer returns: 'Unable to instantiate decoder'

**known issue**: This issue happen really often in debug mode.

## You cannot play clean content (all OS)

Here are the steps to consider before opening a ticket in issue tracker

## Check you can access to remote file

Ensure you can download to manifest / content file with a browser for example

## Check another player can read the content

Usually clear playback can be read with all Video player. Then you should ensure content can be played without any issue with another player ([VideoLan/VLC](https://www.videolan.org/vlc/) is a good reference implementation)

## You cannot play protected content (all OS)

## Protected content gives error (token error / access forbidden) 

If content is protected with an access token or any other http header, ensure you can access to you data with a wget call or a rest client app. You need to provide all needed access token / authentication parameters.

## I need to debug network calls but I don't see them in react native debugging tools

This is a react native limitation. React native tools can only see network calls done in JS.
To achieve that, you need to record network trace to ensure communications with server is correct.
[Charles proxy](https://www.charlesproxy.com/) or [Fiddler](https://www.telerik.com/fiddler) are a simple and useful tool to sniff all http/https calls.
With these tool you should be able to analyze what is going on with network. You will see all access to content and DRM, audio / video chunks, ...

Then try to compare exchanges with previous tests you made.

## Debug media3: build from media3 source

If you need to use a specific exoplayer version or patch default behavior, you may want to build from media3 source code.

Building from media3 source is possible. You need to add 2 or 3 things in your app:

### Configure player path

You need to add following lines in settings.gradle to configure your media3 source path:

```gradle
gradle.ext.androidxMediaModulePrefix = 'media-'
apply from: file("../../../../media3/core_settings.gradle")
````

Of course, you should replace with media3 source path. Be carefull, you need to use the same version (or version with compatible api) that the package support.

### Enable building from source
In your build.gradle file, add following setting:

```gradle
buildscript {
    ext {
        ...
        buildFromMedia3Source = true
        ...
    }
}
```

### Desugaring
to be able to link you may also need to enable coreLibraryDesugaringEnabled in your app.

See: https://developer.android.com/studio/write/java8-support?hl=fr#library-desugaring for more informations.

## It's still not working

You can try to open a ticket now !
