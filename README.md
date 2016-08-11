## react-native-video

A `<Video>` component for react-native, as seen in
[react-native-login](https://github.com/brentvatne/react-native-login)!

Requires react-native >= 0.19.0

### Add it to your project

Run `npm install react-native-video --save`

#### iOS

Install [rnpm](https://github.com/rnpm/rnpm) and run `rnpm link react-native-video`

If you would like to allow other apps to play music over your video component, add:

**AppDelegate.m**
```
#import <AVFoundation/AVFoundation.h>  // import

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ...
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];  // allow
  ...
}
```

#### Android

Install [rnpm](https://github.com/rnpm/rnpm) and run `rnpm link react-native-video`

Or if you have trouble using [rnpm](https://github.com/rnpm/rnpm), make the following additions to the given files manually:

**android/settings.gradle**
```
include ':react-native-video'
project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android')
```

**android/app/build.gradle**
```
dependencies {
   ...
   compile project(':react-native-video')
}
```

**MainActivity.java**

On top, where imports are:
```java
import com.brentvatne.react.ReactVideoPackage;
```

Under `.addPackage(new MainReactPackage())`:
```java
.addPackage(new ReactVideoPackage())
```


### Note:In react-native >= 0.29.0 you have to edit MainApplication.java

**MainApplication.java** (react-native >= 0.29.0)

On top, where imports are:
```java
import com.brentvatne.react.ReactVideoPackage;
```

Under `.addPackage(new MainReactPackage())`:
```java
.addPackage(new ReactVideoPackage())
```



## Usage

```javascript
// Within your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if you like.
<Video source={{uri: "background"}} // Can be a URL or a local file.
       rate={1.0}                   // 0 is paused, 1 is normal.
       volume={1.0}                 // 0 is muted, 1 is normal.
       muted={false}                // Mutes the audio entirely.
       paused={false}               // Pauses playback entirely.
       resizeMode="cover"           // Fill the whole screen at aspect ratio.
       repeat={true}                // Repeat forever.
       playInBackground={false}     // Audio continues to play when app entering background.
       playWhenInactive={false}     // [iOS] Video continues to play when control or notification center are shown.
       onLoadStart={this.loadStart} // Callback when video starts to load
       onLoad={this.setDuration}    // Callback when video loads
       onProgress={this.setTime}    // Callback every ~250ms with currentTime
       onEnd={this.onEnd}           // Callback when playback finishes
       onError={this.videoError}    // Callback when video cannot be loaded
       style={styles.backgroundVideo} />

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

### Play in background on iOS

To enable audio to play in background on iOS the audio session needs to be set to `AVAudioSessionCategoryPlayback`. See [Apple documentation][3].

## Static Methods

`seek(seconds)`

Seeks the video to the specified time (in seconds). Access using a ref to the component

## Examples

- See an [Example integration][1] in `react-native-login` *note that this example uses an older version of this library, before we used `export default` -- if you use `require` you will need to do `require('react-native-video').default` as per instructions above.
- Try the included [VideoPlayer example][2] yourself:

   ```sh
   git clone git@github.com:brentvatne/react-native-video.git
   cd react-native-video/Examples/VideoPlayer
   npm install
   open VideoPlayer.xcodeproj

   ```

   Then `Cmd+R` to start the React Packager, build and run the project in the simulator.

## TODOS

- [ ] Add support for captions
- [ ] Add support for playing multiple videos in a sequence (will interfere with current `repeat` implementation)
- [ ] Callback to get buffering progress for remote videos
- [ ] Bring API closer to HTML5 `<Video>` [reference](http://www.w3schools.com/tags/ref_av_dom.asp)

[1]: https://github.com/brentvatne/react-native-login/blob/56c47a5d1e23781e86e19b27e10427fd6391f666/App/Screens/UserInfoScreen.js#L32-L35
[2]: https://github.com/brentvatne/react-native-video/tree/master/Examples/VideoPlayer
[3]: https://developer.apple.com/library/ios/qa/qa1668/_index.html

---

**MIT Licensed**
