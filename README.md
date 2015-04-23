## react-native-video

A <Video> component for react-native, as seen in
[react-native-login](https://github.com/brentvatne/react-native-login).

### Add it to your project

1. Run `npm install react-native-video --save`
2. Open your project in XCode, right click on `Libraries` and click `Add
   Files to "Your Project Name"`
[(Screenshot)](http://url.brentvatne.ca/jQp8) then
[(Screenshot)](http://url.brentvatne.ca/1gqUD) (use the RCTVideo project
rather than the one pictured in screenshot).
3. Add `libRTCVideo.a` to `Build Phases -> Link Binary With Libraries`
   [(Screenshot)](http://url.brentvatne.ca/g9Wp).
4. Whenever you want to use it within React code now you can: `var Video =
   require('react-native-video');`


## Example

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
       onLoad={this.setDuration}    // Callback when video loads
       onProgress={this.setTime}    // Callback every ~250ms with currentTime
       onEnd={this.onEnd}           // Callback when playback finishes
       style={styles.backgroundVideo} />

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

Example code
[here](https://github.com/brentvatne/react-native-login/blob/master/index.ios.js),
or try out the example
[VideoPlayer](https://github.com/brentvatne/react-native-video/tree/master/Examples/VideoPlayer)
app - clone this repo, cd into it, `npm install` open the project in
XCode and build.

## TODOS

- [ ] Add some way to interface with `seekToTime`
- [ ] Add support for captions
- [ ] Support `require('video!...')`
- [ ] Add support for playing multiple videos in a sequence (will interfere with current `repeat` implementation)
- [ ] Callback to get buffering progress for remote videos
- [ ] Bring API closer to HTML5 `<Video>` [reference](http://www.w3schools.com/tags/ref_av_dom.asp)
