# react-native-video
🎬 `<Video>` component for React Native

> **Note:** version 5.2.1 won't have any updates. We are currently working on making a 6.0.0 fully stable

## Documentation
documentation is available at [react-native-video.github.io/react-native-video](https://react-native-video.github.io/react-native-video/)

> if you find some issue with new version, don't hesitate to open a ticket! Also Old version can be found [here](https://github.com/react-native-video/react-native-video/tree/v6.0.0-alpha.8)

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

## Supported by
<p>
    📱 TWG provides both free and commercial support for this project. Feel free to contact us 🤝 to build something awesome together! 🚀
</p>
<a href="https://thewidlarzgroup.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/baners/twg-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./docs/assets/baners/twg-light.png" />
    <img alt="TheWidlarzGroup" src="./docs/assets/baners/twg-light-1.png" />
  </picture>
</a>