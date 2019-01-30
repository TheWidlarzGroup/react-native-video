<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Configurable props](#configurable-props)
  - [allowsExternalPlayback](#allowsexternalplayback)
  - [audioOnly](#audioonly)
  - [bufferConfig](#bufferconfig)
  - [controls](#controls)
  - [filter](#filter)
  - [filterEnabled](#filterenabled)
  - [fullscreen](#fullscreen)
  - [fullscreenAutorotate](#fullscreenautorotate)
  - [fullscreenOrientation](#fullscreenorientation)
  - [headers](#headers)
  - [hideShutterView](#hideshutterview)
  - [id](#id)
  - [ignoreSilentSwitch](#ignoresilentswitch)
  - [maxBitRate](#maxbitrate)
  - [muted](#muted)
  - [paused](#paused)
  - [playInBackground](#playinbackground)
  - [playWhenInactive](#playwheninactive)
  - [poster](#poster)
  - [posterResizeMode](#posterresizemode)
  - [progressUpdateInterval](#progressupdateinterval)
  - [rate](#rate)
  - [repeat](#repeat)
  - [reportBandwidth](#reportbandwidth)
  - [resizeMode](#resizemode)
  - [selectedAudioTrack](#selectedaudiotrack)
  - [selectedTextTrack](#selectedtexttrack)
  - [selectedVideoTrack](#selectedvideotrack)
  - [source](#source)
    - [Asset loaded via require](#asset-loaded-via-require)
    - [URI string](#uri-string)
      - [Web address (http://, https://)](#web-address-http-https)
      - [File path (file://)](#file-path-file)
      - [iPod Library (ipod-library://)](#ipod-library-ipod-library)
      - [Other protocols](#other-protocols)
  - [stereoPan](#stereopan)
  - [textTracks](#texttracks)
  - [useTextureView](#usetextureview)
  - [volume](#volume)
- [Event props](#event-props)
  - [onAudioBecomingNoisy](#onaudiobecomingnoisy)
  - [onBandwidthUpdate](#onbandwidthupdate)
  - [onEnd](#onend)
  - [onExternalPlaybackChange](#onexternalplaybackchange)
  - [onFullscreenPlayerWillPresent](#onfullscreenplayerwillpresent)
  - [onFullscreenPlayerDidPresent](#onfullscreenplayerdidpresent)
  - [onFullscreenPlayerWillDismiss](#onfullscreenplayerwilldismiss)
  - [onFullscreenPlayerDidDismiss](#onfullscreenplayerdiddismiss)
  - [onLoad](#onload)
  - [onLoadStart](#onloadstart)
  - [onProgress](#onprogress)
  - [onSeek](#onseek)
  - [onTimedMetadata](#ontimedmetadata)
- [Methods](#methods)
  - [dismissFullscreenPlayer](#dismissfullscreenplayer)
  - [presentFullscreenPlayer](#presentfullscreenplayer)
  - [save](#save)
  - [seek()](#seek)
    - [Exact seek](#exact-seek)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### Configurable props

#### allowsExternalPlayback

Indicates whether the player allows switching to external playback mode such as AirPlay or HDMI.

- **true (default)** - allow switching to external playback mode
- **false** - Don't allow switching to external playback mode

Platforms: iOS

#### audioOnly

Indicates whether the player should only play the audio track and instead of displaying the video track, show the poster instead.

- **false (default)** - Display the video as normal
- **true** - Show the poster and play the audio

For this to work, the poster prop must be set.

Platforms: all

#### bufferConfig

Adjust the buffer settings. This prop takes an object with one or more of the properties listed below.

| Property                | Type   | Description                                                                                                                                                                                     |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minBufferMs             | number | The default minimum duration of media that the player will attempt to ensure is buffered at all times, in milliseconds.                                                                         |
| maxBufferMs             | number | The default maximum duration of media that the player will attempt to buffer, in milliseconds.                                                                                                  |
| bufferForPlaybackMs     | number | The default duration of media that must be buffered for playback to start or resume following a user action such as a seek, in milliseconds.                                                    |
| playbackAfterRebufferMs | number | The default duration of media that must be buffered for playback to resume after a rebuffer, in milliseconds. A rebuffer is defined to be caused by buffer depletion rather than a user action. |

This prop should only be set when you are setting the source, changing it after the media is loaded will cause it to be reloaded.

Example with default values:

```
bufferConfig={{
  minBufferMs: 15000,
  maxBufferMs: 50000,
  bufferForPlaybackMs: 2500,
  bufferForPlaybackAfterRebufferMs: 5000
}}
```

Platforms: Android ExoPlayer

#### controls

Determines whether to show player controls.

- ** false (default)** - Don't show player controls
- **true** - Show player controls

Note on iOS, controls are always shown when in fullscreen mode.

Controls are not available Android because the system does not provide a stock set of controls. You will need to build your own or use a package like [react-native-video-controls](https://github.com/itsnubix/react-native-video-controls) or [react-native-video-player](https://github.com/cornedor/react-native-video-player).

Platforms: iOS, react-native-dom

#### filter

Add video filter

- **FilterType.NONE (default)** - No Filter
- **FilterType.INVERT** - CIColorInvert
- **FilterType.MONOCHROME** - CIColorMonochrome
- **FilterType.POSTERIZE** - CIColorPosterize
- **FilterType.FALSE** - CIFalseColor
- **FilterType.MAXIMUMCOMPONENT** - CIMaximumComponent
- **FilterType.MINIMUMCOMPONENT** - CIMinimumComponent
- **FilterType.CHROME** - CIPhotoEffectChrome
- **FilterType.FADE** - CIPhotoEffectFade
- **FilterType.INSTANT** - CIPhotoEffectInstant
- **FilterType.MONO** - CIPhotoEffectMono
- **FilterType.NOIR** - CIPhotoEffectNoir
- **FilterType.PROCESS** - CIPhotoEffectProcess
- **FilterType.TONAL** - CIPhotoEffectTonal
- **FilterType.TRANSFER** - CIPhotoEffectTransfer
- **FilterType.SEPIA** - CISepiaTone

For more details on these filters refer to the [iOS docs](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html#//apple_ref/doc/uid/TP30000136-SW55).

Notes:

1. Using a filter can impact CPU usage. A workaround is to save the video with the filter and then load the saved video.
2. Video filter is currently not supported on HLS playlists.
3. `filterEnabled` must be set to `true`

Platforms: iOS

#### filterEnabled

Enable video filter.

- **false (default)** - Don't enable filter
- **true** - Enable filter

Platforms: iOS

#### fullscreen

Controls whether the player enters fullscreen on play.

- **false (default)** - Don't display the video in fullscreen
- **true** - Display the video in fullscreen

Platforms: iOS

#### fullscreenAutorotate

If a preferred [fullscreenOrientation](#fullscreenorientation) is set, causes the video to rotate to that orientation but permits rotation of the screen to orientation held by user. Defaults to TRUE.

Platforms: iOS

#### fullscreenOrientation

- **all (default)** -
- **landscape**
- **portrait**

Platforms: iOS

#### headers

Pass headers to the HTTP client. Can be used for authorization. Headers must be a part of the source object.

To enable this on iOS, you will need to manually edit RCTVideo.m and uncomment the header code in the playerItemForSource function. This is because the code used a private API and may cause your app to be rejected by the App Store. Use at your own risk.

Example:

```
source={{
  uri: "https://www.example.com/video.mp4",
  headers: {
    Authorization: 'bearer some-token-value',
    'X-Custom-Header': 'some value'
  }
}}
```

Platforms: Android ExoPlayer

#### hideShutterView

Controls whether the ExoPlayer shutter view (black screen while loading) is enabled.

- **false (default)** - Show shutter view
- **true** - Hide shutter view

Platforms: Android ExoPlayer

#### id

Set the DOM id element so you can use document.getElementById on web platforms. Accepts string values.

Example:

```
id="video"
```

Platforms: react-native-dom

#### ignoreSilentSwitch

Controls the iOS silent switch behavior

- **"inherit" (default)** - Use the default AVPlayer behavior
- **"ignore"** - Play audio even if the silent switch is set
- **"obey"** - Don't play audio if the silent switch is set

Platforms: iOS

#### maxBitRate

Sets the desired limit, in bits per second, of network bandwidth consumption when multiple video streams are available for a playlist.

Default: 0. Don't limit the maxBitRate.

Example:

```
maxBitRate={2000000} // 2 megabits
```

Platforms: Android ExoPlayer, iOS

#### muted

Controls whether the audio is muted

- **false (default)** - Don't mute audio
- **true** - Mute audio

Platforms: all

#### paused

Controls whether the media is paused

- **false (default)** - Don't pause the media
- **true** - Pause the media

Platforms: all

#### playInBackground

Determine whether the media should continue playing while the app is in the background. This allows customers to continue listening to the audio.

- **false (default)** - Don't continue playing the media
- **true** - Continue playing the media

To use this feature on iOS, you must:

- [Enable Background Audio](https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/AudioSessionBasics/AudioSessionBasics.html#//apple_ref/doc/uid/TP40007875-CH3-SW3) in your Xcode project
- Set the ignoreSilentSwitch prop to "ignore"

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### playWhenInactive

Determine whether the media should continue playing when notifications or the Control Center are in front of the video.

- **false (default)** - Don't continue playing the media
- **true** - Continue playing the media

Platforms: iOS

#### poster

An image to display while the video is loading
<br>Value: string with a URL for the poster, e.g. "https://baconmockup.com/300/200/"

Platforms: all

#### posterResizeMode

Determines how to resize the poster image when the frame doesn't match the raw video dimensions.

- **"contain" (default)** - Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or less than the corresponding dimension of the view (minus padding).
- **"center"** - Center the image in the view along both dimensions. If the image is larger than the view, scale it down uniformly so that it is contained in the view.
- **"cover"** - Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or larger than the corresponding dimension of the view (minus padding).
- **"none"** - Don't apply resize
- **"repeat"** - Repeat the image to cover the frame of the view. The image will keep its size and aspect ratio. (iOS only)
- **"stretch"** - Scale width and height independently, This may change the aspect ratio of the src.

Platforms: all

#### progressUpdateInterval

Delay in milliseconds between onProgress events in milliseconds.

Default: 250.0

Platforms: all

#### rate

Speed at which the media should play.

- **0.0** - Pauses the video
- **1.0** - Play at normal speed
- **Other values** - Slow down or speed up playback

Platforms: all

Note: For Android MediaPlayer, rate is only supported on Android 6.0 and higher devices.

#### repeat

Determine whether to repeat the video when the end is reached

- **false (default)** - Don't repeat the video
- **true** - Repeat the video

Platforms: all

#### reportBandwidth

Determine whether to generate onBandwidthUpdate events. This is needed due to the high frequency of these events on ExoPlayer.

- **false (default)** - Generate onBandwidthUpdate events
- **true** - Don't generate onBandwidthUpdate events

Platforms: Android ExoPlayer

#### resizeMode

Determines how to resize the video when the frame doesn't match the raw video dimensions.

- **"none" (default)** - Don't apply resize
- **"contain"** - Scale the video uniformly (maintain the video's aspect ratio) so that both dimensions (width and height) of the video will be equal to or less than the corresponding dimension of the view (minus padding).
- **"cover"** - Scale the video uniformly (maintain the video's aspect ratio) so that both dimensions (width and height) of the image will be equal to or larger than the corresponding dimension of the view (minus padding).
- **"stretch"** - Scale width and height independently, This may change the aspect ratio of the src.

Platforms: Android ExoPlayer, Android MediaPlayer, iOS, Windows UWP

#### selectedAudioTrack

Configure which audio track, if any, is played.

```
selectedAudioTrack={{
  type: Type,
  value: Value
}}
```

Example:

```
selectedAudioTrack={{
  type: "title",
  value: "Dubbing"
}}
```

| Type               | Value  | Description                                                                                 |
| ------------------ | ------ | ------------------------------------------------------------------------------------------- |
| "system" (default) | N/A    | Play the audio track that matches the system language. If none match, play the first track. |
| "disabled"         | N/A    | Turn off audio                                                                              |
| "title"            | string | Play the audio track with the title specified as the Value, e.g. "French"                   |
| "language"         | string | Play the audio track with the language specified as the Value, e.g. "fr"                    |
| "index"            | number | Play the audio track with the index specified as the value, e.g. 0                          |

If a track matching the specified Type (and Value if appropriate) is unavailable, the first audio track will be played. If multiple tracks match the criteria, the first match will be used.

Platforms: Android ExoPlayer, iOS

#### selectedTextTrack

Configure which text track (caption or subtitle), if any, is shown.

```
selectedTextTrack={{
  type: Type,
  value: Value
}}
```

Example:

```
selectedTextTrack={{
  type: "title",
  value: "English Subtitles"
}}
```

| Type               | Value  | Description                                                                   |
| ------------------ | ------ | ----------------------------------------------------------------------------- |
| "system" (default) | N/A    | Display captions only if the system preference for captions is enabled        |
| "disabled"         | N/A    | Don't display a text track                                                    |
| "title"            | string | Display the text track with the title specified as the Value, e.g. "French 1" |
| "language"         | string | Display the text track with the language specified as the Value, e.g. "fr"    |
| "index"            | number | Display the text track with the index specified as the value, e.g. 0          |

Both iOS & Android (only 4.4 and higher) offer Settings to enable Captions for hearing impaired people. If "system" is selected and the Captions Setting is enabled, iOS/Android will look for a caption that matches that customer's language and display it.

If a track matching the specified Type (and Value if appropriate) is unavailable, no text track will be displayed. If multiple tracks match the criteria, the first match will be used.

Platforms: Android ExoPlayer, iOS

#### selectedVideoTrack

Configure which video track should be played. By default, the player uses Adaptive Bitrate Streaming to automatically select the stream it thinks will perform best based on available bandwidth.

```
selectedVideoTrack={{
  type: Type,
  value: Value
}}
```

Example:

```
selectedVideoTrack={{
  type: "resolution",
  value: 480
}}
```

| Type             | Value  | Description                                                                  |
| ---------------- | ------ | ---------------------------------------------------------------------------- |
| "auto" (default) | N/A    | Let the player determine which track to play using ABR                       |
| "disabled"       | N/A    | Turn off video                                                               |
| "resolution"     | number | Play the video track with the height specified, e.g. 480 for the 480p stream |
| "index"          | number | Play the video track with the index specified as the value, e.g. 0           |

If a track matching the specified Type (and Value if appropriate) is unavailable, ABR will be used.

Platforms: Android ExoPlayer

#### source

Sets the media source. You can pass an asset loaded via require or an object with a uri.

The docs for this prop are incomplete and will be updated as each option is investigated and tested.

##### Asset loaded via require

Example:

```
const sintel = require('./sintel.mp4');

source={sintel}
```

##### URI string

A number of URI schemes are supported by passing an object with a `uri` attribute.

###### Web address (http://, https://)

Example:

```
source={{uri: 'https://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_10mb.mp4' }}
```

Platforms: all

###### File path (file://)

Example:

```
source={{ uri: 'file:///sdcard/Movies/sintel.mp4' }}
```

Note: Your app will need to request permission to read external storage if you're accessing a file outside your app.

Platforms: Android ExoPlayer, Android MediaPlayer, possibly others

###### iPod Library (ipod-library://)

Path to a sound file in your iTunes library. Typically shared from iTunes to your app.

Example:

```
source={{ uri: 'ipod-library:///path/to/music.mp3' }}
```

Note: Using this feature adding an entry for NSAppleMusicUsageDescription to your Info.plist file as described [here](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html)

Platforms: iOS

###### Other protocols

The following other types are supported on some platforms, but aren't fully documented yet:
`content://, ms-appx://, ms-appdata://, assets-library://`

#### stereoPan

Adjust the balance of the left and right audio channels. Any value between –1.0 and 1.0 is accepted.

- **-1.0** - Full left
- **0.0 (default)** - Center
- **1.0** - Full right

Platforms: Android MediaPlayer

#### textTracks

Load one or more "sidecar" text tracks. This takes an array of objects representing each track. Each object should have the format:

| Property | Description                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title    | Descriptive name for the track                                                                                                                                                                             |
| language | 2 letter [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) representing the language                                                                                                 |
| type     | Mime type of the track<br> _ TextTrackType.SRT - SubRip (.srt)<br> _ TextTrackType.TTML - TTML (.ttml)<br> \* TextTrackType.VTT - WebVTT (.vtt)<br>iOS only supports VTT, Android ExoPlayer supports all 3 |
| uri      | URL for the text track. Currently, only tracks hosted on a webserver are supported                                                                                                                         |

On iOS, sidecar text tracks are only supported for individual files, not HLS playlists. For HLS, you should include the text tracks as part of the playlist.

Note: Due to iOS limitations, sidecar text tracks are not compatible with Airplay. If textTracks are specified, AirPlay support will be automatically disabled.

Example:

```
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

Platforms: Android ExoPlayer, iOS

#### useTextureView

Controls whether to output to a TextureView or SurfaceView.

SurfaceView is more efficient and provides better performance but has two limitations:

- It can't be animated, transformed or scaled
- You can't overlay multiple SurfaceViews

useTextureView can only be set at same time you're setting the source.

- **true (default)** - Use a TextureView
- **false** - Use a SurfaceView

Platforms: Android ExoPlayer

#### volume

Adjust the volume.

- **1.0 (default)** - Play at full volume
- **0.0** - Mute the audio
- **Other values** - Reduce volume

Platforms: all

### Event props

#### onAudioBecomingNoisy

Callback function that is called when the audio is about to become 'noisy' due to a change in audio outputs. Typically this is called when audio output is being switched from an external source like headphones back to the internal speaker. It's a good idea to pause the media when this happens so the speaker doesn't start blasting sound.

Payload: none

Platforms: Android ExoPlayer, iOS

#### onBandwidthUpdate

Callback function that is called when the available bandwidth changes.

Payload:

| Property | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| bitrate  | number | The estimated bitrate in bits/sec |

Example:

```
{
  bitrate: 1000000
}
```

Note: On Android ExoPlayer, you must set the [reportBandwidth](#reportbandwidth) prop to enable this event. This is due to the high volume of events generated.

Platforms: Android ExoPlayer

#### onEnd

Callback function that is called when the player reaches the end of the media.

Payload: none

Platforms: all

#### onExternalPlaybackChange

Callback function that is called when external playback mode for current playing video has changed. Mostly useful when connecting/disconnecting to Apple TV – it's called on connection/disconnection.

Payload:

| Property                 | Type    | Description                                                 |
| ------------------------ | ------- | ----------------------------------------------------------- |
| isExternalPlaybackActive | boolean | Boolean indicating whether external playback mode is active |

Example:

```
{
  isExternalPlaybackActive: true
}
```

Platforms: iOS

#### onFullscreenPlayerWillPresent

Callback function that is called when the player is about to enter fullscreen mode.

Payload: none

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### onFullscreenPlayerDidPresent

Callback function that is called when the player has entered fullscreen mode.

Payload: none

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### onFullscreenPlayerWillDismiss

Callback function that is called when the player is about to exit fullscreen mode.

Payload: none

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### onFullscreenPlayerDidDismiss

Callback function that is called when the player has exited fullscreen mode.

Payload: none

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### onLoad

Callback function that is called when the media is loaded and ready to play.

Payload:

| Property        | Type   | Description                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| currentPosition | number | Time in seconds where the media will start                                                                                                                                                                                                                                                                                                                     |
| duration        | number | Length of the media in seconds                                                                                                                                                                                                                                                                                                                                 |
| naturalSize     | object | Properties:<br> _ width - Width in pixels that the video was encoded at<br> _ height - Height in pixels that the video was encoded at<br> \* orientation - "portrait" or "landscape"                                                                                                                                                                           |
| audioTracks     | array  | An array of audio track info objects with the following properties:<br> _ index - Index number<br> _ title - Description of the track<br> _ language - 2 letter [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) or 3 letter [ISO639-2](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) language code<br> _ type - Mime type of track |
| textTracks      | array  | An array of text track info objects with the following properties:<br> _ index - Index number<br> _ title - Description of the track<br> _ language - 2 letter [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) or 3 letter [ISO 639-2](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) language code<br> _ type - Mime type of track |

Example:

```
{
  canPlaySlowForward: true,
  canPlayReverse: false,
  canPlaySlowReverse: false,
  canPlayFastForward: false,
  canStepForward: false,
  canStepBackward: false,
  currentTime: 0,
  duration: 5910.208984375,
  naturalSize: {
     height: 1080
     orientation: 'landscape'
     width: '1920'
  },
  audioTracks: [
    { language: 'es', title: 'Spanish', type: 'audio/mpeg', index: 0 },
    { language: 'en', title: 'English', type: 'audio/mpeg', index: 1 }
  ],
  textTracks: [
    { title: '#1 French', language: 'fr', index: 0, type: 'text/vtt' },
    { title: '#2 English CC', language: 'en', index: 1, type: 'text/vtt' },
    { title: '#3 English Director Commentary', language: 'en', index: 2, type: 'text/vtt' }
  ]
}
```

Platforms: all

#### onLoadStart

Callback function that is called when the media starts loading.

Payload:

| Property  | Description |
| --------- | ----------- |
| isNetwork | boolean     | Boolean indicating if the media is being loaded from the network |
| type      | string      | Type of the media. Not available on Windows |
| uri       | string      | URI for the media source. Not available on Windows |

Example:

```
{
  isNetwork: true,
  type: '',
  uri: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
}
```

Platforms: all

#### onProgress

Callback function that is called every progressUpdateInterval seconds with info about which position the media is currently playing.

| Property         | Type   | Description                                                                                       |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------- |
| currentTime      | number | Current position in seconds                                                                       |
| playableDuration | number | Position to where the media can be played to using just the buffer in seconds                     |
| seekableDuration | number | Position to where the media can be seeked to in seconds. Typically, the total length of the media |

Example:

```
{
  currentTime: 5.2,
  playableDuration: 34.6,
  seekableDuration: 888
}
```

Platforms: all

#### onSeek

Callback function that is called when a seek completes.

Payload:

| Property    | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| currentTime | number | The current time after the seek |
| seekTime    | number | The requested time              |

Example:

```
{
  currentTime: 100.5
  seekTime: 100
}
```

Both the currentTime & seekTime are reported because the video player may not seek to the exact requested position in order to improve seek performance.

Platforms: Android ExoPlayer, Android MediaPlayer, iOS, Windows UWP

#### onTimedMetadata

Callback function that is called when timed metadata becomes available

Payload:

| Property | Type  | Description               |
| -------- | ----- | ------------------------- |
| metadata | array | Array of metadata objects |

Example:

```
{
  metadata: [
    { value: 'Streaming Encoder', identifier: 'TRSN' },
    { value: 'Internet Stream', identifier: 'TRSO' },
    { value: 'Any Time You Like', identifier: 'TIT2' }
  ]
}
```

Support for timed metadata on Android MediaPlayer is limited at best and only compatible with some videos. It requires a target SDK of 23 or higher.

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

### Methods

Methods operate on a ref to the Video element. You can create a ref using code like:

```
return (
  <Video source={...}
    ref => (this.player = ref) />
);
```

#### dismissFullscreenPlayer

`dismissFullscreenPlayer()`

Take the player out of fullscreen mode.

Example:

```
this.player.dismissFullscreenPlayer();
```

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### presentFullscreenPlayer

`presentFullscreenPlayer()`

Put the player in fullscreen mode.

On iOS, this displays the video in a fullscreen view controller with controls.

On Android ExoPlayer & MediaPlayer, this puts the navigation controls in fullscreen mode. It is not a complete fullscreen implementation, so you will still need to apply a style that makes the width and height match your screen dimensions to get a fullscreen video.

Example:

```
this.player.presentFullscreenPlayer();
```

Platforms: Android ExoPlayer, Android MediaPlayer, iOS

#### save

`save(): Promise`

Save video to your Photos with current filter prop. Returns promise.

Example:

```
let response = await this.save();
let path = response.uri;
```

Notes:

- Currently only supports highest quality export
- Currently only supports MP4 export
- Currently only supports exporting to user's cache directory with a generated UUID filename.
- User will need to remove the saved video through their Photos app
- Works with cached videos as well. (Checkout video-caching example)
- If the video is has not began buffering (e.g. there is no internet connection) then the save function will throw an error.
- If the video is buffering then the save function promise will return after the video has finished buffering and processing.

Future:

- Will support multiple qualities through options
- Will support more formats in the future through options
- Will support custom directory and file name through options

Platforms: iOS

#### seek()

`seek(seconds)`

Seek to the specified position represented by seconds. seconds is a float value.

`seek()` can only be called after the `onLoad` event has fired. Once completed, the [onSeek](#onseek) event will be called.

Example:

```
this.player.seek(200); // Seek to 3 minutes, 20 seconds
```

Platforms: all

##### Exact seek

By default iOS seeks within 100 milliseconds of the target position. If you need more accuracy, you can use the seek with tolerance method:

`seek(seconds, tolerance)`

tolerance is the max distance in milliseconds from the seconds position that's allowed. Using a more exact tolerance can cause seeks to take longer. If you want to seek exactly, set tolerance to 0.

Example:

```
this.player.seek(120, 50); // Seek to 2 minutes with +/- 50 milliseconds accuracy
```

Platforms: iOS
