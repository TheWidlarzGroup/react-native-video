# react-native-video
🎬 `<Video>` component for React Native

## Documentation
documentation is available at [thewidlarzgroup.github.io/react-native-video/](https://thewidlarzgroup.github.io/react-native-video/)

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

## Community support
We have an discord server where you can ask questions and get help. [Join the discord server](https://discord.gg/WXuM4Tgb9X)

## Enterprise Support
<p>
  📱 <i>react-native-video</i> is provided <i>as it is</i>. For enterprise support or other business inquiries, <a href="https://www.thewidlarzgroup.com/">please contact us 🤝</a>. We can help you with the integration, customization and maintenance. We are providing both free and commercial support for this project. let's build something awesome together! 🚀
</p>
<a href="https://www.thewidlarzgroup.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/baners/twg-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./docs/assets/baners/twg-light.png" />
    <img alt="TheWidlarzGroup" src="./docs/assets/baners/twg-light.png" />
  </picture>
</a>
