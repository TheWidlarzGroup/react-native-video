# Methods
This page shows the list of available methods

## Component methods

| Name                                                                                      |Platforms Support  | 
|-------------------------------------------------------------------------------------------|-------------------|
|[dismissFullscreenPlayer](#dismissfullscreenplayer)                                        |Android, iOS       |
|[presentFullscreenPlayer](#presentfullscreenplayer)                                        |Android, iOS       |
|[pause](#pause)                                                                            |Android, iOS       |
|[play](#play)                                                                              |Android, iOS       |
|[save](#save)                                                                              |iOS                |
|[restoreUserInterfaceForPictureInPictureStop](#restoreuserinterfaceforpictureinpicturestop)|iOS                |
|[seek](#seek)                                                                              |All                |

### `dismissFullscreenPlayer`
`dismissFullscreenPlayer(): Promise<void>`

Take the player out of fullscreen mode.

Platforms: Android, iOS

### `presentFullscreenPlayer`
`presentFullscreenPlayer(): Promise<void>`

Put the player in fullscreen mode.

On iOS, this displays the video in a fullscreen view controller with controls.

On Android, this puts the navigation controls in fullscreen mode. It is not a complete fullscreen implementation, so you will still need to apply a style that makes the width and height match your screen dimensions to get a fullscreen video.

Platforms: Android, iOS

### `pause`
`pause(): Promise<void>`

Pause the video.


Platforms: Android, iOS

### `play`
`play(): Promise<void>`

Play the video.


Platforms: Android, iOS

### `save`
`save(): Promise<{ uri: string }>`

Save video to your Photos with current filter prop. Returns promise.


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

### `restoreUserInterfaceForPictureInPictureStopCompleted`
`restoreUserInterfaceForPictureInPictureStopCompleted(restored)`

This function corresponds to the completion handler in Apple's [restoreUserInterfaceForPictureInPictureStop](https://developer.apple.com/documentation/avkit/avpictureinpicturecontrollerdelegate/1614703-pictureinpicturecontroller?language=objc). IMPORTANT: This function must be called after `onRestoreUserInterfaceForPictureInPictureStop` is called. 


Platforms: iOS

### `seek`
`seek(seconds)`

Seek to the specified position represented by seconds. seconds is a float value.

`seek()` can only be called after the `onLoad` event has fired. Once completed, the [onSeek](#onseek) event will be called.


Platforms: all

#### Exact seek

By default iOS seeks within 100 milliseconds of the target position. If you need more accuracy, you can use the seek with tolerance method:

`seek(seconds, tolerance)`

tolerance is the max distance in milliseconds from the seconds position that's allowed. Using a more exact tolerance can cause seeks to take longer. If you want to seek exactly, set tolerance to 0.

Platforms: iOS



### Example Usage
```tsx
const videoRef = useRef<VideoRef>(null);

const someCoolFunctions = async () => {
  if(!videoRef.current) {
    return;
  }

  // present or dismiss fullscreen player
  videoRef.current.presentFullscreenPlayer();
  videoRef.current.dismissFullscreenPlayer();

  // pause or play the video
  videoRef.current.play();
  videoRef.current.pause();

  // save video to your Photos with current filter prop
  const response = await videoRef.current.save();
  const path = response.uri;

  // seek to the specified position represented by seconds
  videoRef.current.seek(200);
  // or on iOS you can seek with tolerance
  videoRef.current.seek(200, 10);
};

return (
  <Video
    ref={videoRef}
    source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
  />
);
```

## Static methods

### `getWidevineLevel`
Indicates whether the widevine level supported by device.

Possible values are:
  - 0 - unable to determine widevine support (typically not supported)
  - 1, 2, 3 - Widevine level supported

Platform: Android

### `isCodecSupported`
Indicates whether the provided codec is supported level supported by device.

parameters:
- `mimetype`: mime type of codec to query
- `width`, `height`: resolution to query

Possible results:
- `hardware` - codec is supported by hardware
- `software` - codec is supported by software only
- `unsupported` - codec is not supported

Platform: Android

### `isHEVCSupported`
Helper which Indicates whether the provided HEVC/1920*1080 is supported level supported by device. It uses isCodecSupported internally.

Platform: Android

### Example Usage
```tsx
import { VideoDecoderProperties } from 'react-native-video';

VideoDecoderProperties.getWidevineLevel().then((level) => {
  ...
});

VideoDecoderProperties.isCodecSupported('video/hevc', 1920, 1080).then((support) => {
  ...
});

VideoDecoderProperties.isHEVCSupported().then((support) => {
  ...
});
```