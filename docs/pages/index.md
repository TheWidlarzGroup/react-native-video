# A `<Video>` component for React Native

## About
`react-native-video` is a React Native library that provides a Video component that renders media content such as videos and streams

## Beta Information
> ⚠️ **Version 6 Beta**: The following documentation may refer to features only available through the v6.0.0 alpha releases, [please see version 5.2.x](https://github.com/react-native-video/react-native-video/blob/v5.2.0/README.md) for the current documentation!

Version 6.x recommends react-native >= 0.68.2.

For older versions of react-native, [please use version 5.x](https://github.com/react-native-video/react-native-video/tree/v5.2.0).

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

### Version 6.0.0 breaking changes

Version 6.0.0 is introducing dozens of breaking changes, mostly through updated dependencies and significant refactoring. While the API remains compatible, the significant internal changes require full testing with your app to ensure all functionality remains operational. Please view the [Changelog](CHANGELOG.md) for specific breaking changes.  

### Installing Version 6.0.0 Beta

Whilst we finalise version 6.0.0 you can install the latest beta from npm

Using npm:

```bash

npm install --save react-native-video@beta

```

using yarn:

```bash

yarn add react-native-video@beta

```