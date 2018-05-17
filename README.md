## react-native-video

A `<Video>` component for react-native, forked from https://github.com/react-native-community/react-native-video

Limited scope video component for Android and iOS:
- No DRM
- Only iOS and Android
- Remote video and Local media sources are the priority
- Expansion files not supported
- Only ExoPlayer and native iOS player support
- Only supports hls (and dash - Android Only)

Requires react-native >= 0.50.0, no backward compatibility.

### Add it to your project

Run `yarn add react-native-video`

#### iOS

Run `react-native link` to link the react-native-video library.

If you would like to allow other apps to play music over your video component, add:

**AppDelegate.m**

```objective-c
#import <AVFoundation/AVFoundation.h>  // import

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ...
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];  // allow
  ...
}
```
Note: you can also use the `ignoreSilentSwitch` prop, shown below.

#### tvOS

Run `react-native link` to link the react-native-video library.

`react-native link` don’t works properly with the tvOS target so we need to add the library manually.

First select your project in Xcode.

<img src="./docs/tvOS-step-1.jpg" width="40%">

After that, select the tvOS target of your application and select « General » tab

<img src="./docs/tvOS-step-2.jpg" width="40%">

Scroll to « Linked Frameworks and Libraries » and tap on the + button

<img src="./docs/tvOS-step-3.jpg" width="40%">

Select RCTVideo-tvOS

<img src="./docs/tvOS-step-4.jpg" width="40%">

That’s all, you can use react-native-video for your tvOS application

#### Android

Run `react-native link` to link the react-native-video library.

Or if you have trouble, make the following additions to the given files manually:

**android/settings.gradle**

```gradle
include ':react-native-video'
project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android-exoplayer')
```

**android/app/build.gradle**

```gradle
dependencies {
   ...
   compile project(':react-native-video')
}
```

**MainApplication.java  (react-native >= 0.29.0)**

On top, where imports are:

```java
import com.brentvatne.react.ReactVideoPackage;
```

Under `.addPackage(new MainReactPackage())`:

```java
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.asList(
            new MainReactPackage(),
            new ReactVideoPackage()
    );
}
```

## Usage

```javascript
// Within your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if you like.

<Video source={{uri: "background"}}   // Can be a URL or a local file.
       poster="https://baconmockup.com/300/200/" // uri to an image to display until the video plays
       ref={(ref) => {
         this.player = ref
       }}                                      // Store reference
       rate={1.0}                              // 0 is paused, 1 is normal.
       volume={1.0}                            // 0 is muted, 1 is normal.
       muted={false}                           // Mutes the audio entirely.
       paused={false}                          // Pauses playback entirely.
       resizeMode="cover"                      // Fill the whole screen at aspect ratio.*
       repeat={true}                           // Repeat forever.
       playInBackground={false}                // Audio continues to play when app entering background.
       playWhenInactive={false}                // [iOS] Video continues to play when control or notification center are shown.
       ignoreSilentSwitch={"ignore"}           // [iOS] ignore | obey - When 'ignore', audio will still play with the iOS hard silent switch set to silent. When 'obey', audio will toggle with the switch. When not specified, will inherit audio settings as usual.
       progressUpdateInterval={250.0}          // [iOS] Interval to fire onProgress (default to ~250ms)
       onLoadStart={this.loadStart}            // Callback when video starts to load
       onLoad={this.setDuration}               // Callback when video loads
       onProgress={this.setTime}               // Callback every ~250ms with currentTime
       onEnd={this.onEnd}                      // Callback when playback finishes
       onError={this.videoError}               // Callback when video cannot be loaded
       onBuffer={this.onBuffer}                // Callback when remote video is buffering
       onTimedMetadata={this.onTimedMetadata}  // Callback when the stream receive some metadata
       style={styles.backgroundVideo} />

// Later to trigger fullscreen
this.player.presentFullscreenPlayer()

// To set video position in seconds (seek)
this.player.seek(0)

// Later on in your styles..
var styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
```

- * *For iOS you also need to specify muted for this to work*

### Load files with the RN Asset System

The asset system [introduced in RN `0.14`](http://www.reactnative.com/react-native-v0-14-0-released/) allows loading image resources shared across iOS and Android without touching native code. As of RN `0.31` [the same is true](https://github.com/facebook/react-native/commit/91ff6868a554c4930fd5fda6ba8044dbd56c8374) of mp4 video assets for Android. As of [RN `0.33`](https://github.com/facebook/react-native/releases/tag/v0.33.0) iOS is also supported. Requires `react-native-video@0.9.0`.

```
<Video
  repeat
  resizeMode='cover'
  source={require('../assets/video/turntable.mp4')}
  style={styles.backgroundVideo}
/>
```

### Play in background on iOS

To enable audio to play in background on iOS the audio session needs to be set to `AVAudioSessionCategoryPlayback`. See [Apple documentation][3] for additional details. (NOTE: there is now a ticket to [expose this as a prop]( https://github.com/react-native-community/react-native-video/issues/310) )

## Static Methods

`seek(seconds)`

Seeks the video to the specified time (in seconds). Access using a ref to the component

`presentFullscreenPlayer()`

Toggles a fullscreen player. Access using a ref to the component.

## Examples

- DRIVETRIBE app

## TODOS

- [ ] Add support for captions
- [ ] Add support for playing multiple videos in a sequence (will interfere with current `repeat` implementation)
- [x] Callback to get buffering progress for remote videos
- [ ] Bring API closer to HTML5 `<Video>` [reference](http://devdocs.io/html/element/video)

[1]: https://github.com/brentvatne/react-native-login/blob/56c47a5d1e23781e86e19b27e10427fd6391f666/App/Screens/UserInfoScreen.js#L32-L35
[2]: https://github.com/react-native-community/react-native-video/tree/master/example
[3]: https://developer.apple.com/library/ios/qa/qa1668/_index.html

---

**MIT Licensed**
