# react-native-video caching example (currently only working on iOS)

# How to verify that caching is working (iOS)

1. run `./update.sh`
2. open `ios/VideoCaching.xcworkspace`
3. build and run project in simulator
4. after the video is loaded -> disconnect from the internet
5. kill the application
6. start the application again -> the video is there despite being offline :)

# How to verify that you can build the project without the caching feature (iOS)

1. In `ios/Podfile` apply the following changes
```diff
- pod 'react-native-video/VideoCaching', :path => '../node_modules/react-native-video/react-native-video.podspec'
+ pod 'react-native-video', :path => '../node_modules/react-native-video/react-native-video.podspec'
```
2. run `./update.sh`
3. open `ios/VideoCaching.xcworkspace`
4. build and run project in simulator
5. after the video is loaded -> disconnect from the internet
6. kill the application
7. start the application again -> the video should not load
