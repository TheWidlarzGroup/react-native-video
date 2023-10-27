# react-native-video
🎬 `<Video>` component for React Native

> **Note:** version 5.2.1 won't have any updates. We are currently working on making a alpha 6.0.0 stable

## Documentation
Old version of documentation can be found [here](https://github.com/react-native-video/react-native-video/tree/v6.0.0-alpha.8)
New documentation will be available soon at [react-native-video.github.io/react-native-video](https://react-native-video.github.io/react-native-video/), if you find some issue with new version, don't hesitate to open a ticket!

## Usage

```javascript
// Load the module

import Video, {VideoRef} from 'react-native-video';

// Within your render function, assuming you have a file called
// "background.mp4" in your project. You can include multiple videos
// on a single screen if you like.

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
    // Callback when video cannot be loaded              
    onError={onError}               
    style={styles.backgroundVideo}
   />
 )
}

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

