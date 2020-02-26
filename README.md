## react-native-video-android-cache

react-native-video-android-cache lib provide you video component from [react-native-video](https://github.com/react-native-community/react-native-video) with feature to cache your videos while streaming.

 
## Reason to create react-native-video-android-cache

1. React-native-video does not have video cache while it streams video for Android, it does support cache for IOS. 

2. React-native-video’s repeat prop is used to repeat video once it's finished like in loop but it was making a lot of network calls which is bad for user’s data usage.

There was two choices to cache videos

### [react-native-video-cache](https://github.com/zhigang1992/react-native-video-cache)

Basically react-native-video-cache creates a local proxy server to play videos using AndroidVideoCache and when it's complete caching its serve videos through cache directory.Which is perfect but when I test it on BrowserStack, Videos was not playing, was getting 502 error.


### [react-native-fs](https://github.com/itinance/react-native-fs) and [react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob)

Both library usage file systems to download and store data. But if you have multiple number videos to download at a time or just say when you wait for a video to download and then play video which is frustrating also not correct to make user wait.


## Solution

Why not we use android’s exo-player from react-native-video and create a custom class where we can cache videos while they are streaming using exo-players’s CacheDataSource.

That's what react-native-video-android-cache does.
react-native-video-android-cache/android-exoplayer/src/main/java/com/brentvatne/exoplayer/AndroidCacheDataSourceFactory.java is a custom class to cache videos.

And inside ReactExoplayerView.java instead of returning default mediaDataSourceFactory return the AndroidCacheDataSourceFactory with three parameter Context, maxCacheSize(default 324mb),maxFileSize(default 10mb).
I came up with this solution through a [stackOverFlow](https://stackoverflow.com/questions/28700391/using-cache-in-exoplayer#) solution.


## Installation and Usage

### Step 1
Npm install --save git+https://git@github.com/paddy57/react-native-video-android-cache.git

### Step 2
You may need to link react-native-video to your project. Follow this link (https://github.com/react-native-community/react-native-video#android-installation) 

That's it. Just observe app cache size increasing while you stream videos. Yeahh.

---

**MIT Licensed**


