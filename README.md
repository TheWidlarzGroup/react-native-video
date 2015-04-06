## react-native-video

A <Video> component for react-native, as seen in
[react-native-login](https://github.com/brentvatne/react-native-login).

### Add it to your project

1. Run `npm install react-native-video --save`
2. Open your project in XCode, right click on `Libraries` and click `Add
   Files to "Your Project Name"` [(Screenshot)](http://url.brentvatne.ca/g9Wp).
3. Add `libRTCVideo.a` to `Build Phases -> Link Binary With Libraries`
   [(Screenshot)](http://url.brentvatne.ca/g9Wp).
4. Click on `RCTVideo.xcodeproj` in `Libraries` and go the `Build
   Phases` tab. Double click the text to the right of `Header Search
   Paths` and verify that it has `$(SRCROOT)../react-native/React` - if it
   isn't, then add it. This is so XCode is able to find the headers that
   the `RCTVideo` source files are referring to by pointing to the
   header files installed within the `react-native` `node_modules`
   directory. [(Screenshot)](http://url.brentvatne.ca/7wE0).
5. Whenever you want to use it within React code now you can: `var Video =
   require('react-native-video');`


## Example

```javascript
// Within your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if you like.
<Video source={"background"} style={styles.backgroundVideo}
       resizeMode="cover" repeat={true} />

// Later on in your styles..
var styles = Stylesheet.create({
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
```

Example code [here](https://github.com/brentvatne/react-native-login/blob/master/index.ios.js).

## TODOS

- [ ] Support `require('video!...')`
- [ ] Support other extensions than mp4?
- [x] Switch to AVPlayer (0.1.6)
- [x] Switch resizeMode to prop instead of style (0.1.7)
- [x] Add `pause` prop (0.1.7)
- [ ] Add `playbackRate` prop
- [ ] Add `volume` prop
- [ ] Add `muted` prop
- [ ] Add some way to get back the `currentTime` value
- [x] Add some way to get back the `duration` value
- [ ] Add some way to interface with `seekToTime`
- [ ] Add support for captions
- [ ] Add support for playing multiple videos in a sequence (will interfere with current `repeat` implementation)
- [ ] Any other [for other AVPlayer props](https://developer.apple.com/library/prerelease/ios/documentation/AVFoundation/Reference/AVPlayer_Class/index.html)
