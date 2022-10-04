
<div align="center">
  <picture>
    <img src="./docs/logo.svg" width="460" height="225" alt="React Native Video" />
  </picture>
  <br><br>
  <p>A <code>&lt;Video/></code> component for iOS, tvOS, Android, Android TV, and Windows UWP.</p>


---

[![npm](https://img.shields.io/npm/dm/react-native-video?logo=npm)](https://www.npmjs.com/package/react-native-video)
[![npm (tag)](https://img.shields.io/npm/v/react-native-video/latest?logo=npm)](https://www.npmjs.com/package/react-native-video)
[![npm (tag)](https://img.shields.io/npm/v/react-native-video/alpha?logo=npm)](https://www.npmjs.com/package/react-native-video/v/6.0.0-alpha.3)
[![GitHub issues](https://img.shields.io/github/issues-raw/react-native-video/react-native-video?logo=github)](https://github.com/react-native-video/react-native-video/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/react-native-video/react-native-video?logo=github)](https://github.com/react-native-video/react-native-video/pulls)

---

</div>

# React Native Video

Native video components for React Native backed by **[AVPlayer](./ios/Video)**, **[ExoPlayer](./android/src/main/java/com/brentvatne/exoplayer)**, and **[Windows Media Core](./windows/ReactNativeVideoCPP)**. Play streaming media, local files and [DRM protected content](./docs/DRM.md) with support for Widevine, Playready, FairPlay and Clearkey DRM schemes.

## Version Support

| React Native | RN Video | Documentation |
| ------------ | -------- | ------------- |
| >= 0.68.2    | 6.0.0    | [Version 6.x](API.md) |
| <= 0.68.1    | 5.2.1    | [Version 5.x](https://github.com/react-native-video/react-native-video/tree/v5.2.0). |

## Version 6.0.0 Breaking Changes

Version 6.0.0 is introducing dozens of breaking changes, mostly through updated dependecies and significant refactoring. While the API remains compatible, the significant internal changes require full testing with your app to ensure all functionality remains operational. Please view the [Changelog](CHANGELOG.md) for specific breaking changes.

## Installing Version 6.0.0
Whilst we finalise version 6.0.0 you can install the latest alpha from npm

```bash
# npm
npm install --save react-native-video@alpha

# yarn
yarn add react-native-video@alpha
```


## Usage

```javascript
import Video from 'react-native-video';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
});

const onBuffer = () => {
  console.log('buffering');
};

const onError = (error) => {
  console.log(error);
};

const App = () => {
  return (
    <>
      <Video 
        source={{uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4'}} // Can be a URL or a local file.                                   
        onBuffer={onBuffer} // Callback when remote video is buffering
        onError={onError} // Callback when video cannot be loaded
        style={styles.backgroundVideo}
      />
     <>
   );
};

export default App;
```

## Useful Resources
- 📖 [Documentation](API.md)
- 📓 [Changelog](CHANGELOG.md)
- 🙋‍♀️ [Contribution Guide](CONTRIBUTING.md)
- 🎒 [Useful Side Projects](./docs/PROJECTS.md)
- 👾 [Advanced Debugging](./docs/DEBUGGING.md)

## Contributors

We'd like to thank the many contributors! React Native Video is a democratic open source project and this project would not be possible without our community contributing back. [Learn how you can get involved](CONTRIBUTING.md).

<a href="https://github.com/react-native-video/react-native-video/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=react-native-video/react-native-video" width="100%" />
</a>


**react-native-video** was originally created by [Brent Vatne](https://github.com/brentvatne)
