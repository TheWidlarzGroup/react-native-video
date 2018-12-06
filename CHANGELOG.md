## Changelog

### Version 4.1.0
* Generate onSeek on Android ExoPlayer & MediaPlayer after seek completes [#1351](https://github.com/react-native-community/react-native-video/pull/1351)
* Remove unneeded onVideoSaved event [#1350](https://github.com/react-native-community/react-native-video/pull/1350)
* Disable AirPlay if sidecar text tracks are enabled [#1304](https://github.com/react-native-community/react-native-video/pull/1304)
* Add possibility to remove black screen while video is loading in Exoplayer [#1355](https://github.com/react-native-community/react-native-video/pull/1355)

### Version 4.0.1
* Add missing files to package.json [#1342](https://github.com/react-native-community/react-native-video/pull/1342)

### Version 4.0.0
* Partial support for timed metadata on Android MediaPlayer [#707](https://github.com/react-native-community/react-native-video/pull/707)
* Support video caching for iOS [#955](https://github.com/react-native-community/react-native-video/pull/955)
* Video caching cleanups [#1172](https://github.com/react-native-community/react-native-video/pull/1172)
* Add ipod-library support [#926](https://github.com/react-native-community/react-native-video/pull/926/files)
* Fix crash on ExoPlayer when there are no audio tracks [#1233](https://github.com/react-native-community/react-native-video/pull/1233)
* Reduce package size [#1231](https://github.com/react-native-community/react-native-video/pull/1231)
* Remove unnecessary import in TextTrackType [#1229](https://github.com/react-native-community/react-native-video/pull/1229)
* Prevent flash between poster and video [#1167](https://github.com/react-native-community/react-native-video/pull/1167)
* Support react-native-dom [#1253](https://github.com/react-native-community/react-native-video/pull/1253)
* Update to ExoPlayer 2.8.2. Android SDK 26 now required [#1170](https://github.com/react-native-community/react-native-video/pull/1170)
* Update to ExoPlayer 2.8.4 [#1266](https://github.com/react-native-community/react-native-video/pull/1266)
* Add fullscreenOrientation option for iOS [#1215](https://github.com/react-native-community/react-native-video/pull/1215)
* Update to ExoPlayer 2.9.0 [#1285](https://github.com/react-native-community/react-native-video/pull/1285)
* Switch useTextureView to default to `true` [#1286](https://github.com/react-native-community/react-native-video/pull/1286)
* Re-add fullscreenAutorotate prop [#1303](https://github.com/react-native-community/react-native-video/pull/1303)
* Make seek throw a useful error for NaN values [#1283](https://github.com/react-native-community/react-native-video/pull/1283)
* Video Filters and Save Video [#1306](https://github.com/react-native-community/react-native-video/pull/1306)
* Fix: volume should not change on onAudioFocusChange event [#1327](https://github.com/react-native-community/react-native-video/pull/1327)
* Update ExoPlayer to 2.9.1 and OkHTTP to 3.12.0 [#1338](https://github.com/react-native-community/react-native-video/pull/1338)

### Version 3.2.0
* Basic fullscreen support for Android MediaPlayer [#1138](https://github.com/react-native-community/react-native-video/pull/1138)
* Simplify default Android SDK code [#1145](https://github.com/react-native-community/react-native-video/pull/1145) [#1146](https://github.com/react-native-community/react-native-video/pull/1146)
* Various iOS sideloaded text track fixes [#1157](https://github.com/react-native-community/react-native-video/pull/1157)
* Fix #1150 where assets with bundled assets don't work on iOS in release mode [#1162](https://github.com/react-native-community/react-native-video/pull/1162)
* Support configuring the buffer on Android ExoPlayer [#1160](https://github.com/react-native-community/react-native-video/pull/1160)
* Prevent sleep from sleeping while videos are playing on Android MediaPlayer [#1117](https://github.com/react-native-community/react-native-video/pull/1117)
* Update NewtonSoft JSON to match react-native-windows version [#1169](https://github.com/react-native-community/react-native-video/pull/1169)

### Version 3.1.0
* Support sidecar text tracks on iOS [#1109](https://github.com/react-native-community/react-native-video/pull/1109)
* Support onAudioBecomingNoisy on iOS [#1131](https://github.com/react-native-community/react-native-video/pull/1131)

### Version 3.0
* Inherit Android buildtools and SDK version from the root project [#1081](https://github.com/react-native-community/react-native-video/pull/1081)
* Automatically play on ExoPlayer when the paused prop is not set [#1083](https://github.com/react-native-community/react-native-video/pull/1083)
* Preserve Android MediaPlayer paused prop when backgrounding [#1082](https://github.com/react-native-community/react-native-video/pull/1082)
* Support specifying headers on ExoPlayer as part of the source [#805](https://github.com/react-native-community/react-native-video/pull/805)
* Prevent iOS onLoad event during seeking [#1088](https://github.com/react-native-community/react-native-video/pull/1088)
* ExoPlayer playableDuration incorrect [#1089](https://github.com/react-native-community/react-native-video/pull/1089)

### Version 2.3.1
* Revert PR to inherit Android SDK versions from root project. Re-add in 3.0 [#1080](https://github.com/react-native-community/react-native-video/pull/1080)

### Version 2.3.0
* Support allowsExternalPlayback on iOS [#1057](https://github.com/react-native-community/react-native-video/pull/1057)
* Inherit Android buildtools and SDK version from the root project [#999](https://github.com/react-native-community/react-native-video/pull/999)
* Fix bug that caused ExoPlayer to start paused if playInBackground was set [#833](https://github.com/react-native-community/react-native-video/pull/833)
* Fix crash if clearing an observer on iOS that was already cleared [#1075](https://github.com/react-native-community/react-native-video/pull/1075)
* Add audioOnly prop for music files [#1039](https://github.com/react-native-community/react-native-video/pull/1039)
* Support seeking with more exact tolerance on iOS [#1076](https://github.com/react-native-community/react-native-video/pull/1076)

### Version 2.2.0
* Text track selection support for iOS & ExoPlayer [#1049](https://github.com/react-native-community/react-native-video/pull/1049)
* Support outputting to a TextureView on Android ExoPlayer [#1058](https://github.com/react-native-community/react-native-video/pull/1058)
* Support changing the left/right balance on Android MediaPlayer [#1051](https://github.com/react-native-community/react-native-video/pull/1051)
* Prevent multiple onEnd notifications on iOS [#832](https://github.com/react-native-community/react-native-video/pull/832)
* Fix doing a partial swipe on iOS causing a black screen [#1048](https://github.com/react-native-community/react-native-video/pull/1048)
* Fix crash when switching to a new source on iOS [#974](https://github.com/react-native-community/react-native-video/pull/974)
* Add cookie support for ExoPlayer [#922](https://github.com/react-native-community/react-native-video/pull/922)
* Remove ExoPlayer onMetadata that wasn't being used [#1040](https://github.com/react-native-community/react-native-video/pull/1040)
* Fix bug where setting the progress interval on iOS didn't work [#800](https://github.com/react-native-community/react-native-video/pull/800)
* Support setting the poster resize mode [#595](https://github.com/react-native-community/react-native-video/pull/595)
