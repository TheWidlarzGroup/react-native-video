---
sidebar_label: Events
sidebar_position: 3
---

# Handling Player Events

The `VideoPlayer` emits a variety of events that allow you to monitor and react to changes in its state and playback.

## Available Events

The `VideoPlayer` class, through `VideoPlayerEvents`, supports the following events. You can subscribe to these by assigning a callback function to the corresponding property on the `VideoPlayer` instance.

| Event                      | Description                                                                                                | Callback Data Example                                 |
|----------------------------|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| `onAudioBecomingNoisy`     | Fired when audio is about to become noisy (e.g., headphones unplugged).                                      |                                                       |
| `onAudioFocusChange`       | Fired when the audio focus changes (e.g., another app starts playing audio).                               |                                                       |
| `onBandwidthUpdate`        | Fired with an estimate of the available bandwidth.                                                         |                                                       |
| `onBuffer`                 | Fired when the player starts or stops buffering data.                                                      | `{ isBuffering: boolean }`                            |
| `onControlsVisibleChange`  | Fired when the visibility of native controls changes.                                                      |                                                       |
| `onEnd`                    | Fired when the video playback reaches the end.                                                               |                                                       |
| `onExternalPlaybackChange` | Fired when the external playback status changes (e.g., AirPlay).                                           |                                                       |
| `onLoad`                   | Fired when the video has loaded and is ready to play.                                                    | [Video metadata (duration, naturalSize, etc.)](../api-reference/interfaces/onLoadData.md)          |
| `onLoadStart`              | Fired when the video starts loading.                                                                       |                                                       |
| `onPlaybackRateChange`     | Fired when the playback rate changes.                                                                      | `{ rate: number }`                                    |
| `onPlaybackStateChange`    | Fired when the playback state changes (e.g., playing, paused, stopped).                                    | `{ status: VideoPlayerStatus }`                       |
| `onProgress`               | Fired periodically during playback with the current time.                                                    | `{ currentTime: number, playableDuration: number, seekableDuration: number }` |
| `onReadyToDisplay`         | Fired when the player is ready to display the first frame of the video.                                      |                                                       |
| `onSeek`                   | Fired when a seek operation has completed.                                                                 | `{ seekTime: number }`                                |
| `onStatusChange`           | Fired when the player status changes (detailed status updates).                                              |                                                       |
| `onTextTrackDataChanged`   | Fired when text track data (e.g., subtitles) changes.                                                        |                                                       |
| `onTimedMetadata`          | Fired when timed metadata is encountered in the video stream.                                                |                                                       |
| `onVolumeChange`           | Fired when the volume changes.                                                                             | `{ volume: number }`                                  |

Additionally, the `VideoPlayer` instance itself has an `onError` property:

-   `onError`: Fired when a error occurs. The callback receives the `VideoRuntimeError` object.

## Using the `useEvent` Hook

For React functional components, the `useEvent` hook provides a convenient way to subscribe to player events and automatically manage cleanup.

```typescript
import { useVideoPlayer, useEvent } from 'react-native-video';
import { useEffect } from 'react';

const MyVideoComponent = () => {
  const player = useVideoPlayer('https://example.com/video.mp4');

  useEvent(player, 'onLoad', (data) => {
    console.log('Video loaded via useEvent! Duration:', data.duration);
  });

  useEvent(player, 'onProgress', (data) => {
    console.log('Progress via useEvent:', data.currentTime);
  });

  // For onError, which is a direct property on VideoPlayer, not from VideoPlayerEvents
  useEvent(player, 'onError', (error) => {
    console.error('Player Error via useEvent:', error.code, error.message);
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return <VideoView player={player} />;
};
```

**Benefits of `useEvent`**:

-   **Automatic Cleanup**: The event listener is automatically removed when the component unmounts or when the `player`, `event`, or `callback` dependencies change, preventing memory leaks.
-   **Type Safety**: Provides better type inference for event callback parameters.

This hook is recommended for managing event subscriptions in a declarative React style. 

## Subscribing to Events

You can subscribe to an event by assigning a function to the player instance's corresponding property:

```typescript
import { VideoPlayer } from 'react-native-video';

const player = new VideoPlayer('https://example.com/video.mp4');

player.onLoad = (data) => {
  console.log('Video loaded! Duration:', data.duration);
};

player.onProgress = (data) => {
  console.log('Current time:', data.currentTime);
};

player.onError = (error) => {
  console.error('Player Error:', error.code, error.message);
};

player.play();
```

## Clearing Events

-   The `player.clearEvent(eventName)` method can be used to clear a specific native event handler.
-   When a player instance is no longer needed and `player.release()` is called, all event listeners are automatically cleared