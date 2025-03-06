# A `<Video>` Component for React Native

## About
`react-native-video` is a React Native library that provides a Video component to render media content like videos and streams.

It allows you to stream video files (m3u, mpd, mp4, etc.) inside your React Native application.

- ExoPlayer for Android
- AVPlayer for iOS, tvOS, and visionOS
- Windows UWP for Windows
- HTML5 for Web
- Trick mode support
- Subtitles (embedded or side-loaded)
- DRM support
- Client-side ad insertion (via Google IMA)
- PiP (Picture-in-Picture)
- Embedded playback controls
- And more

The goal of this package is to provide lightweight but full control over the player.

## V6.0.0 Information
> ⚠️ **Version 6**: This documentation covers features available only in v6.0.0 and later.
> If you're unsure or need an older version, you can still use [version 5.2.x](https://github.com/TheWidlarzGroup/react-native-video/blob/v5.2.0/README.md).

Version 6.x requires **react-native >= 0.68.2**
> ⚠️ From **6.0.0-beta.8**, it also requires **iOS >= 13.0** (default in React Native 0.73).

For older versions of React Native, [please use version 5.x](https://github.com/TheWidlarzGroup/react-native-video/tree/v5.2.0).

## Usage

```javascript
// Load the module
import Video, { VideoRef } from 'react-native-video';

// Inside your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if needed.

const VideoPlayer = () => {
  const videoRef = useRef<VideoRef>(null);
  const background = require('./background.mp4');

  return (
    <Video
      // Can be a URL or a local file.
      source={background}
      // Store reference  
      ref={videoRef}
      // Callback when remote video is buffering                                      
      onBuffer={onBuffer}
      // Callback when the video cannot be loaded              
      onError={onError}               
      style={styles.backgroundVideo}
    />
  );
};

// Later in your styles...
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

