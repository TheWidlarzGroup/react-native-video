# Configurable props
This page shows the list of available properties to configure player

## List

| Name                                                                                | Platforms Support         |
|-------------------------------------------------------------------------------------|---------------------------|
| [adTagUrl](#adtagurl)                                                               | Android, iOS              |
| [allowsExternalPlayback](#allowsexternalplayback)                                   | iOS                       |
| [audioOnly](#audioonly)                                                             | All                       |
| [audioOutput](#audioOutput)                                                         | Android, iOS              |
| [automaticallyWaitsToMinimizeStalling](#automaticallywaitstominimizestalling)       | iOS                       |
| [backBufferDurationMs](#backbufferdurationms)                                       | Android                   |
| [bufferConfig](#bufferconfig)                                                       | Android                   |
| [contentStartTime](#contentstarttime)                                               | Android                   |
| [controls](#controls)                                                               | Android, iOS              |
| [currentPlaybackTime](#currentplaybacktime)                                         | Android                   |
| [debug](#debug)                                                                     | Android                   |
| [disableFocus](#disablefocus)                                                       | Android, iOS              |
| [disableDisconnectError](#disabledisconnecterror)                                   | Android                   |
| [filter](#filter)                                                                   | iOS                       |
| [filterEnabled](#filterenabled)                                                     | iOS                       |
| [focusable](#focusable)                                                             | Android                   |
| [fullscreen](#fullscreen)                                                           | Android, iOS              |
| [fullscreenAutorotate](#fullscreenautorotate)                                       | iOS                       |
| [fullscreenOrientation](#fullscreenorientation)                                     | iOS                       |
| [headers](#headers)                                                                 | Android                   |
| [hideShutterView](#hideshutterview)                                                 | Android                   |
| [ignoreSilentSwitch](#ignoresilentswitch)                                           | iOS                       |
| [maxBitRate](#maxbitrate)                                                           | Android, iOS              |
| [minLoadRetryCount](#minloadretrycount)                                             | Android                   |
| [mixWithOthers](#mixwithothers)                                                     | iOS                       |
| [muted](#muted)                                                                     | All                       |
| [paused](#paused)                                                                   | All                       |
| [pictureInPicture](#pictureinpicture)                                               | iOS                       |
| [playInBackground](#playinbackground)                                               | Android, iOS              |
| [playWhenInactive](#playwheninactive)                                               | iOS                       |
| [poster](#poster)                                                                   | All                       |
| [posterResizeMode](#posterresizemode)                                               | All                       |
| [preferredForwardBufferDuration](#preferredforwardbufferduration)                   | iOS                       |
| [preventsDisplaySleepDuringVideoPlayback](#preventsdisplaysleepduringvideoplayback) | iOS, Android              |
| [progressUpdateInterval](#progressupdateinterval)                                   | All                       |
| [rate](#rate)                                                                       | All                       |
| [repeat](#repeat)                                                                   | All                       |
| [reportBandwidth](#reportbandwidth)                                                 | Android                   |
| [resizeMode](#resizemode)                                                           | Android, iOS, Windows UWP |
| [selectedAudioTrack](#selectedaudiotrack)                                           | Android, iOS              |
| [selectedTextTrack](#selectedtexttrack)                                             | Android, iOS              |
| [selectedVideoTrack](#selectedvideotrack)                                           | Android                   |
| [shutterColor](#shutterColor)                                                       | Android                   |
| [source](#source)                                                                   | All                       |
| [subtitleStyle](#subtitlestyle)                                                     | Android                   |
| [textTracks](#texttracks)                                                           | Android, iOS              |
| [trackId](#trackid)                                                                 | Android                   |
| [useTextureView](#usetextureview)                                                   | Android                   |
| [useSecureView](#usesecureview)                                                     | Android                   |
| [volume](#volume)                                                                   | All                       |
| [localSourceEncryptionKeyScheme](#localsourceencryptionkeyscheme)                   | All                       |

## Details
### `adTagUrl`
Sets the VAST uri to play AVOD ads.

Example:
```
adTagUrl="https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator="
```

Note: On android, you need enable IMA SDK in gradle file, see: [enable client side ads insertion](#enable-client-side-ads-insertion)


Platforms: Android, iOS

### `allowsExternalPlayback`
Indicates whether the player allows switching to external playback mode such as AirPlay or HDMI.
* **true (default)** - allow switching to external playback mode
* **false** -  Don't allow switching to external playback mode

Platforms: iOS

### `audioOnly`
Indicates whether the player should only play the audio track and instead of displaying the video track, show the poster instead.
* **false (default)** - Display the video as normal
* **true** - Show the poster and play the audio

For this to work, the poster prop must be set.

Platforms: all

### `audioOutput`
Changes the audio output.
* **speaker (default)** - plays through speaker
* **earpiece** - plays through earpiece

Platforms: Android, iOS

### `automaticallyWaitsToMinimizeStalling`
A Boolean value that indicates whether the player should automatically delay playback in order to minimize stalling. For clients linked against iOS 10.0 and later
* **false** - Immediately starts playback
* **true (default)** - Delays playback in order to minimize stalling

Platforms: iOS

### `backBufferDurationMs`
The number of milliseconds of buffer to keep before the current position. This allows rewinding without rebuffering within that duration.

Platforms: Android

### `bufferConfig`
Adjust the buffer settings. This prop takes an object with one or more of the properties listed below.

Property | Type | Description
--- | --- | ---
minBufferMs | number | The default minimum duration of media that the player will attempt to ensure is buffered at all times, in milliseconds.
maxBufferMs | number | The default maximum duration of media that the player will attempt to buffer, in milliseconds.
bufferForPlaybackMs | number | The default duration of media that must be buffered for playback to start or resume following a user action such as a seek, in milliseconds.
bufferForPlaybackAfterRebufferMs | number | The default duration of media that must be buffered for playback to resume after a rebuffer, in milliseconds. A rebuffer is defined to be caused by buffer depletion rather than a user action.
maxHeapAllocationPercent | number | The percentage of available heap that the video can use to buffer, between 0 and 1
minBackBufferMemoryReservePercent | number | The percentage of available app memory at which during startup the back buffer will be disabled, between 0 and 1
minBufferMemoryReservePercent | number | The percentage of available app memory to keep in reserve that prevents buffer from using it, between 0 and 1

This prop should only be set when you are setting the source, changing it after the media is loaded will cause it to be reloaded.

Example with default values:
```javascript
bufferConfig={{
  minBufferMs: 15000,
  maxBufferMs: 50000,
  bufferForPlaybackMs: 2500,
  bufferForPlaybackAfterRebufferMs: 5000
}}
```

Platforms: Android

### `chapters`
To provide a custom chapter source for tvOS. This prop takes an array of objects with the properties listed below.

| Property  | Type    | Description                                                                                                                                               |
|-----------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| title     | string  | The title of the chapter to create                                                                                                                        |
| startTime | number  | The start time of the chapter in seconds                                                                                                                  |
| endTime   | number  | The end time of the chapter in seconds                                                                                                                    |
| uri       | string? | Optional: Provide an http orl or the some base64 string to override the image of the chapter. For some media files the images are generated automatically |


Platforms: tvOS

### `currentPlaybackTime`
When playing an HLS live stream with a `EXT-X-PROGRAM-DATE-TIME` tag configured, then this property will contain the epoch value in msec.

Platforms: Android, iOS

### `controls`
Determines whether to show player controls.
* **false (default)** - Don't show player controls
* **true** - Show player controls

Note on iOS, controls are always shown when in fullscreen mode.
Note on Android, native controls are available by default.
If needed, you can also add your controls or use a package like [react-native-video-controls](https://github.com/itsnubix/react-native-video-controls) or [react-native-media-console](https://github.com/criszz77/react-native-media-console), see [Useful Side Project](/projects).

Platforms: Android, iOS

### `contentStartTime`
The start time in ms for SSAI content. This determines at what time to load the video info like resolutions. Use this only when you have SSAI stream where ads resolution is not the same as content resolution.

Platforms: Android

### `debug`

Enable more verbosity in logs.

> [!WARNING]
> Do not use this open in production build

| Property                | Type   | Description                                                                                 |
| ------------------ | ------ | ------------------------------------------------------------------------------------------- |
| `enable` | boolean    | when true, display logs with verbosity higher |
| `thread` | boolean    | enable thread display  |


Example with default values:
```javascript
debug={{
  enable: true,
  thread: true,
}}
```
Platforms: Android


### `disableFocus`
Determines whether video audio should override background music/audio in Android devices.
* **false (default)** - Override background audio/music
* **true** - Let background audio/music from other apps play
 
Note: Allows multiple videos to play if set to `true`. If `false`, when one video is playing and another is started, the first video will be paused.
 
Platforms: Android

### `disableDisconnectError`
Determines if the player needs to throw an error when connection is lost or not
* **false (default)** - Player will throw an error when connection is lost
* **true** - Player will keep trying to buffer when network connect is lost

Platforms: Android

### `DRM`
To setup DRM please follow [this guide](/component/drm)

Platforms: Android, iOS

### `filter`
Add video filter
* **FilterType.NONE (default)** - No Filter
* **FilterType.INVERT** - CIColorInvert
* **FilterType.MONOCHROME** - CIColorMonochrome
* **FilterType.POSTERIZE** - CIColorPosterize
* **FilterType.FALSE** - CIFalseColor
* **FilterType.MAXIMUMCOMPONENT** - CIMaximumComponent
* **FilterType.MINIMUMCOMPONENT** - CIMinimumComponent
* **FilterType.CHROME** - CIPhotoEffectChrome
* **FilterType.FADE** - CIPhotoEffectFade
* **FilterType.INSTANT** - CIPhotoEffectInstant
* **FilterType.MONO** - CIPhotoEffectMono
* **FilterType.NOIR** - CIPhotoEffectNoir
* **FilterType.PROCESS** - CIPhotoEffectProcess
* **FilterType.TONAL** - CIPhotoEffectTonal
* **FilterType.TRANSFER** - CIPhotoEffectTransfer
* **FilterType.SEPIA** - CISepiaTone

For more details on these filters refer to the [iOS docs](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html#//apple_ref/doc/uid/TP30000136-SW55).

Notes: 
1. Using a filter can impact CPU usage. A workaround is to save the video with the filter and then load the saved video.
2. Video filter is currently not supported on HLS playlists.
3. `filterEnabled` must be set to `true`

Platforms: iOS

### `filterEnabled`
Enable video filter. 

* **false (default)** - Don't enable filter
* **true** - Enable filter

Platforms: iOS

### `Focusable`
Whether this video view should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
* **false** - Makes view unfocusable
* **true (default)** - Makes view focusable
 
Platforms: Android


### `fullscreen`
Controls whether the player enters fullscreen on play.
See [presentFullscreenPlayer](#presentfullscreenplayer) for details.

* **false (default)** - Don't display the video in fullscreen
* **true** - Display the video in fullscreen

Platforms: iOS, Android

### `fullscreenAutorotate`
If a preferred [fullscreenOrientation](#fullscreenorientation) is set, causes the video to rotate to that orientation but permits rotation of the screen to orientation held by user. Defaults to TRUE.

Platforms: iOS

### `fullscreenOrientation`

* **all (default)** - 
* **landscape**
* **portrait**

Platforms: iOS

### `headers`
Pass headers to the HTTP client. Can be used for authorization. Headers must be a part of the source object.

Example:
```javascript
source={{
  uri: "https://www.example.com/video.mp4",
  headers: {
    Authorization: 'bearer some-token-value',
    'X-Custom-Header': 'some value'
  }
}}
```

Platforms: Android

### `hideShutterView`
Controls whether the ExoPlayer shutter view (black screen while loading) is enabled.

* **false (default)** - Show shutter view 
* **true** - Hide shutter view

Platforms: Android

### `ignoreSilentSwitch`
Controls the iOS silent switch behavior
* **"inherit" (default)** - Use the default AVPlayer behavior
* **"ignore"** - Play audio even if the silent switch is set
* **"obey"** - Don't play audio if the silent switch is set

Platforms: iOS

### `maxBitRate`
Sets the desired limit, in bits per second, of network bandwidth consumption when multiple video streams are available for a playlist.

Default: 0. Don't limit the maxBitRate.

Example:
```javascript
maxBitRate={2000000} // 2 megabits
```

Platforms: Android, iOS

### `minLoadRetryCount`
Sets the minimum number of times to retry loading data before failing and reporting an error to the application. Useful to recover from transient internet failures.

Default: 3. Retry 3 times.

Example:
```javascript
minLoadRetryCount={5} // retry 5 times
```

Platforms: Android

### `mixWithOthers`
Controls how Audio mix with other apps.
* **"inherit" (default)** - Use the default AVPlayer behavior
* **"mix"** - Audio from this video mixes with audio from other apps.
* **"duck"** - Reduces the volume of other apps while audio from this video plays.

Platforms: iOS

### `muted`
Controls whether the audio is muted
* **false (default)** - Don't mute audio
* **true** - Mute audio

Platforms: all

### `paused`
Controls whether the media is paused
* **false (default)** - Don't pause the media
* **true** - Pause the media

Platforms: all

### `pictureInPicture`
Determine whether the media should played as picture in picture.
* **false (default)** - Don't not play as picture in picture
* **true** - Play the media as picture in picture

NOTE: Video ads cannot start when you are using the PIP on iOS (more info available at [Google IMA SDK Docs](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side/picture_in_picture?hl=en#starting_ads)). If you are using custom controls, you must hide your PIP button when you receive the ```STARTED``` event from ```onReceiveAdEvent``` and show it again when you receive the ```ALL_ADS_COMPLETED``` event.

Platforms: iOS

### `playInBackground`
Determine whether the media should continue playing while the app is in the background. This allows customers to continue listening to the audio.
* **false (default)** - Don't continue playing the media
* **true** - Continue playing the media

To use this feature on iOS, you must:
* [Enable Background Audio](https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/AudioSessionBasics/AudioSessionBasics.html#//apple_ref/doc/uid/TP40007875-CH3-SW3) in your Xcode project
* Set the ignoreSilentSwitch prop to "ignore"

Platforms: Android, iOS

### `playWhenInactive`
Determine whether the media should continue playing when notifications or the Control Center are in front of the video.
* **false (default)** - Don't continue playing the media
* **true** - Continue playing the media

Platforms: iOS

### `poster`
An image to display while the video is loading
<br>Value: string with a URL for the poster, e.g. "https://baconmockup.com/300/200/"

Platforms: all

### `posterResizeMode`
Determines how to resize the poster image when the frame doesn't match the raw video dimensions.
* **"contain" (default)** - Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or less than the corresponding dimension of the view (minus padding).
* **"center"** - Center the image in the view along both dimensions. If the image is larger than the view, scale it down uniformly so that it is contained in the view.
* **"cover"** - Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or larger than the corresponding dimension of the view (minus padding).
* **"none"** - Don't apply resize
* **"repeat"** - Repeat the image to cover the frame of the view. The image will keep its size and aspect ratio. (iOS only)
* **"stretch"** - Scale width and height independently, This may change the aspect ratio of the src.

Platforms: all

### `preferredForwardBufferDuration`
The duration the player should buffer media from the network ahead of the playhead to guard against playback disruption. Sets the [preferredForwardBufferDuration](https://developer.apple.com/documentation/avfoundation/avplayeritem/1643630-preferredforwardbufferduration) instance property on AVPlayerItem.

Default: 0

Platforms: iOS

### `preventsDisplaySleepDuringVideoPlayback`
Controls whether or not the display should be allowed to sleep while playing the video. Default is not to allow display to sleep.

Default: true

Platforms: iOS, Android

### `progressUpdateInterval`
Delay in milliseconds between onProgress events in milliseconds.

Default: 250.0

Platforms: all

### `rate`
Speed at which the media should play. 
* **0.0** - Pauses the video
* **1.0** - Play at normal speed
* **Other values** - Slow down or speed up playback

Platforms: all

### `repeat`
Determine whether to repeat the video when the end is reached
* **false (default)** - Don't repeat the video
* **true** - Repeat the video

Platforms: all


### `onAudioTracks`
Callback function that is called when audio tracks change

Payload:

Property | Type | Description
--- | --- | ---
index | number | Internal track ID
title | string | Descriptive name for the track
language | string | 2 letter [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) representing the language
bitrate | number | bitrate of track
type | string | Mime type of track
selected | boolean | true if track is playing

Example:
```javascript
{
  audioTracks: [
    { language: 'es', title: 'Spanish', type: 'audio/mpeg', index: 0, selected: true },
    { language: 'en', title: 'English', type: 'audio/mpeg', index: 1 }
  ],
}
```


Platforms: Android

### `reportBandwidth`
Determine whether to generate onBandwidthUpdate events. This is needed due to the high frequency of these events on ExoPlayer.

* **false (default)** - Don't generate onBandwidthUpdate events
* **true** - Generate onBandwidthUpdate events

Platforms: Android

### `resizeMode`
Determines how to resize the video when the frame doesn't match the raw video dimensions.
* **"none" (default)** - Don't apply resize
* **"contain"** - Scale the video uniformly (maintain the video's aspect ratio) so that both dimensions (width and height) of the video will be equal to or less than the corresponding dimension of the view (minus padding).
* **"cover"** - Scale the video uniformly (maintain the video's aspect ratio) so that both dimensions (width and height) of the image will be equal to or larger than the corresponding dimension of the view (minus padding).
* **"stretch"** - Scale width and height independently, This may change the aspect ratio of the src.

Platforms: Android, iOS, Windows UWP

### `selectedAudioTrack`
Configure which audio track, if any, is played.

```javascript
selectedAudioTrack={{
  type: Type,
  value: Value
}}
```

Example:
```javascript
selectedAudioTrack={{
  type: "title",
  value: "Dubbing"
}}
```

Type | Value | Description
--- | --- | ---
"system" (default) | N/A | Play the audio track that matches the system language. If none match, play the first track.
"disabled" | N/A | Turn off audio
"title" | string | Play the audio track with the title specified as the Value, e.g. "French"
"language" | string | Play the audio track with the language specified as the Value, e.g. "fr"
"index" | number | Play the audio track with the index specified as the value, e.g. 0

If a track matching the specified Type (and Value if appropriate) is unavailable, the first audio track will be played. If multiple tracks match the criteria, the first match will be used.

Platforms: Android, iOS

### `selectedTextTrack`
Configure which text track (caption or subtitle), if any, is shown.

```javascript
selectedTextTrack={{
  type: Type,
  value: Value
}}
```

Example:
```javascript
selectedTextTrack={{
  type: "title",
  value: "English Subtitles"
}}
```

Type | Value | Description
--- | --- | ---
"system" (default) | N/A | Display captions only if the system preference for captions is enabled
"disabled" | N/A | Don't display a text track
"title" | string | Display the text track with the title specified as the Value, e.g. "French 1"
"language" | string | Display the text track with the language specified as the Value, e.g. "fr"
"index" | number | Display the text track with the index specified as the value, e.g. 0

Both iOS & Android (only 4.4 and higher) offer Settings to enable Captions for hearing impaired people. If "system" is selected and the Captions Setting is enabled, iOS/Android will look for a caption that matches that customer's language and display it. 

If a track matching the specified Type (and Value if appropriate) is unavailable, no text track will be displayed. If multiple tracks match the criteria, the first match will be used.

Platforms: Android, iOS

### `selectedVideoTrack`
Configure which video track should be played. By default, the player uses Adaptive Bitrate Streaming to automatically select the stream it thinks will perform best based on available bandwidth.

```javascript
selectedVideoTrack={{
  type: Type,
  value: Value
}}
```

Example:
```javascript
selectedVideoTrack={{
  type: "resolution",
  value: 480
}}
```

Type | Value | Description
--- | --- | ---
"auto" (default) | N/A | Let the player determine which track to play using ABR
"disabled" | N/A | Turn off video
"resolution" | number | Play the video track with the height specified, e.g. 480 for the 480p stream
"index" | number | Play the video track with the index specified as the value, e.g. 0

If a track matching the specified Type (and Value if appropriate) is unavailable, ABR will be used.

Platforms: Android

### `shutterColor`
Apply color to shutter view, if you see black flashes before video start then set 

```javascript
shutterColor='transparent'
```

- black (default)

Platforms: Android

### `source`
Sets the media source. You can pass an asset loaded via require or an object with a uri.

Setting the source will trigger the player to attempt to load the provided media with all other given props. Please be sure that all props are provided before/at the same time as setting the source.

Rendering the player component with a null source will init the player, and start playing once a source value is provided.

Providing a null source value after loading a previous source will stop playback, and clear out the previous source content.

The docs for this prop are incomplete and will be updated as each option is investigated and tested.


#### Asset loaded via require

> ⚠️ on iOS, you file name must not contain spaces eg. `my video.mp4` will not work, use `my-video.mp4` instead

Example: 
```javascript
const sintel = require('./sintel.mp4');

source={sintel}
```

#### URI string

A number of URI schemes are supported by passing an object with a `uri` attribute.

All uri string shall be url encoded.
For exemple 'www.myurl.com/blabla?q=test uri' is invalid, where 'www.myurl.com/blabla?q=test%20uri' is valid

##### Web address (http://, https://)

Example:
```javascript
source={{uri: 'https://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_10mb.mp4' }}
```

Platforms: all

##### File path (file://)

Example:
```javascript
source={{ uri: 'file:///sdcard/Movies/sintel.mp4' }}
```

Note: Your app will need to request permission to read external storage if you're accessing a file outside your app.

Platforms: Android, possibly others

##### iPod Library (ipod-library://)

Path to a sound file in your iTunes library. Typically shared from iTunes to your app.

Example:
```javascript
source={{ uri: 'ipod-library:///path/to/music.mp3' }}
```

Note: Using this feature adding an entry for NSAppleMusicUsageDescription to your Info.plist file as described [here](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html)

Platforms: iOS

##### Explicit mimetype for the stream

Provide a member `type` with value (`mpd`/`m3u8`/`ism`) inside the source object.
Sometimes is needed when URL extension does not match with the mimetype that you are expecting, as seen on the next example. (Extension is .ism -smooth streaming- but file served is on format mpd -mpeg dash-)

Example:
```javascript
source={{ uri: 'http://host-serving-a-type-different-than-the-extension.ism/manifest(format=mpd-time-csf)',
type: 'mpd' }}
```

##### Other protocols

The following other types are supported on some platforms, but aren't fully documented yet:
`content://, ms-appx://, ms-appdata://, assets-library://`

#### Start playback at a specific point in time

Provide an optional `startPosition` for video. Value is in milliseconds. If the `cropStart` prop is applied, it will be applied from that point forward.
(If it is negative or undefined or null, it is ignored)

Platforms: Android, iOS

#### Playing only a portion of the video (start & end time)

Provide an optional `cropStart` and/or `cropEnd` for the video. Value is in milliseconds. Useful when you want to play only a portion of a large video.

Example
```javascript
source={{ uri: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', cropStart: 36012, cropEnd: 48500 }}

source={{ uri: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', cropStart: 36012 }}

source={{ uri: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', cropEnd: 48500 }}
```

Platforms: iOS, Android

#### Overriding the metadata of a source

Provide an optional `title`, `subtitle`, `customImageUri` and/or `description` properties for the video. 
Useful when to adapt the tvOS playback experience.

Example:

```javascript
source={{ 
    uri: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 
    title: 'Custom Title', 
    subtitle: 'Custom Subtitle', 
    description: 'Custom Description',
    customImageUri: 'https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png'
  }}
```

Platforms: tvOS

### `subtitleStyle`

Property | Description | Platforms
--- | --- | ---
fontSize | Adjust the font size of the subtitles. Default: font size of the device | Android
paddingTop | Adjust the top padding of the subtitles. Default: 0| Android
paddingBottom | Adjust the bottom padding of the subtitles. Default: 0| Android
paddingLeft | Adjust the left padding of the subtitles. Default: 0| Android
paddingRight | Adjust the right padding of the subtitles. Default: 0| Android


Example:

```javascript
subtitleStyle={{ paddingBottom: 50, fontSize: 20 }}
```

### `textTracks`
Load one or more "sidecar" text tracks. This takes an array of objects representing each track. Each object should have the format:
> ⚠️ This feature does not work with HLS playlists (e.g m3u8) on iOS

Property | Description
--- | ---
title | Descriptive name for the track
language | 2 letter [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) representing the language
type | Mime type of the track<br> * TextTrackType.SRT - SubRip (.srt)<br> * TextTrackType.TTML - TTML (.ttml)<br> * TextTrackType.VTT - WebVTT (.vtt)<br>iOS only supports VTT, Android supports all 3
uri | URL for the text track. Currently, only tracks hosted on a webserver are supported

On iOS, sidecar text tracks are only supported for individual files, not HLS playlists. For HLS, you should include the text tracks as part of the playlist.

Note: Due to iOS limitations, sidecar text tracks are not compatible with Airplay. If textTracks are specified, AirPlay support will be automatically disabled.

Example:
```javascript
import { TextTrackType }, Video from 'react-native-video';

textTracks={[
  {
    title: "English CC",
    language: "en",
    type: TextTrackType.VTT, // "text/vtt"
    uri: "https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt"
  },
  {
    title: "Spanish Subtitles",
    language: "es",
    type: TextTrackType.SRT, // "application/x-subrip"
    uri: "https://durian.blender.org/wp-content/content/subtitles/sintel_es.srt"
  }
]}
```


Platforms: Android, iOS

### `trackId`
Configure an identifier for the video stream to link the playback context to the events emitted.

Platforms: Android

### `useTextureView`
Controls whether to output to a TextureView or SurfaceView.

SurfaceView is more efficient and provides better performance but has two limitations:
* It can't be animated, transformed or scaled
* You can't overlay multiple SurfaceViews

useTextureView can only be set at same time you're setting the source.

* **true (default)** - Use a TextureView
* **false** - Use a SurfaceView

Platforms: Android

### `useSecureView`
Force the output to a SurfaceView and enables the secure surface.

This will override useTextureView flag.

SurfaceView is is the only one that can be labeled as secure.

* **true** - Use security
* **false (default)** - Do not use security

Platforms: Android

### `volume`
Adjust the volume.
* **1.0 (default)** - Play at full volume
* **0.0** - Mute the audio
* **Other values** - Reduce volume

Platforms: all

### `localSourceEncryptionKeyScheme`
Set the url scheme for stream encryption key for local assets

Type: String

Example:
```
localSourceEncryptionKeyScheme="my-offline-key"
```

Platforms: iOS