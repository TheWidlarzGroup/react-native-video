---
sidebar_label: Events
sidebar_position: 5
---

# Handling Player Events

The `VideoPlayer` emits a variety of events that allow you to monitor and react to changes in its state and playback.

## Using the `useEvent` Hook

For React functional components, the `useEvent` hook provides a convenient way to subscribe to player events and automatically manage cleanup.

```typescript
import { useVideoPlayer, useEvent } from 'react-native-video';
import { useEffect } from 'react';

const MyVideoComponent = () => {
  const player = useVideoPlayer('https://example.com/video.mp4', (_player) => {
    _player.play();
  });

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

  return <VideoView player={player} />;
};
```

## Available Events

The `VideoPlayer` class, through `VideoPlayerEvents`, supports the following events. You can subscribe to these by assigning a callback function to the corresponding property on the `VideoPlayer` instance.

| Event                      | Callback Signature                                      | Description                                                                                 |
|----------------------------|--------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `onAudioBecomingNoisy`     | () => void                                           | Fired when audio is about to become noisy (e.g., headphones unplugged).                     |
| `onAudioFocusChange`       | (hasAudioFocus: boolean) => void                     | Fired when the audio focus changes (e.g., another app starts playing audio).                |
| `onBandwidthUpdate`        | (data: [BandwidthData](../api-reference/interfaces/BandwidthData.md)) => void                        | Fired with an estimate of the available bandwidth.                                          |
| `onBuffer`                 | (buffering: boolean) => void                         | Fired when the player starts or stops buffering data.                                       |
| `onControlsVisibleChange`  | (visible: boolean) => void                           | Fired when the visibility of native controls changes.                                       |
| `onEnd`                    | () => void                                           | Fired when the video playback reaches the end.                                              |
| `onExternalPlaybackChange` | (externalPlaybackActive: boolean) => void            | Fired when the external playback status changes (e.g., AirPlay).                            |
| `onLoad`                   | (data: [onLoadData](../api-reference/interfaces/onLoadData.md)) => void                           | Fired when the video has loaded and is ready to play.                                       |
| `onLoadStart`              | (data: [onLoadStartData](../api-reference/interfaces/onLoadStartData.md)) => void                      | Fired when the video starts loading.                                                        |
| `onPlaybackRateChange`     | (rate: number) => void                               | Fired when the playback rate changes.                                                       |
| `onPlaybackStateChange`    | (data: [onPlaybackStateChangeData](../api-reference/interfaces/onPlaybackStateChangeData.md)) => void            | Fired when the playback state changes (e.g., playing, paused, stopped).                     |
| `onProgress`               | (data: [onProgressData](../api-reference/interfaces/onProgressData.md)) => void                       | Fired periodically during playback with the current time.                                   |
| `onReadyToDisplay`         | () => void                                           | Fired when the player is ready to display the first frame of the video.                     |
| `onSeek`                   | (seekTime: number) => void                           | Fired when a seek operation has completed.                                                  |
| `onStatusChange`           | (status: [VideoPlayerStatus](../api-reference/type-aliases/VideoPlayerStatus.md)) => void                  | Fired when the player status changes (detailed status updates).                             |
| `onTextTrackDataChanged`   | (texts: string[]) => void                            | Fired when text track data (e.g., subtitles) changes.                                       |
| `onTimedMetadata`          | (metadata: [TimedMetadata](../api-reference/interfaces/TimedMetadata.md)) => void                    | Fired when timed metadata is encountered in the video stream.                               |
| `onTrackChange`            | (track: [TextTrack](../api-reference/interfaces/TextTrack.md) \| null) => void                    | Fired when the selected text track changes.                                                 |
| `onVolumeChange`           | (data: [onVolumeChangeData](../api-reference/interfaces/onVolumeChangeData.md)) => void     | Fired when the volume changes.                                                              |

Additionally, the `VideoPlayer` instance itself has an `onError` property:

-   `onError: (error: ` [VideoRuntimeError](../api-reference/classes/VideoRuntimeError.md) `) => void` — Fired when an error occurs. The callback receives the `VideoRuntimeError` object.

**Benefits of `useEvent`**:

-   **Automatic Cleanup**: The event listener is automatically removed when the component unmounts or when the `player`, `event`, or `callback` dependencies change, preventing memory leaks.
-   **Type Safety**: Provides better type inference for event callback parameters.

This hook is recommended for managing event subscriptions in a declarative React style. 

### Initialization Timing and Events

`onLoadStart` / `onLoad` will fire automatically after construction when `initializeOnCreation` (default `true`) is enabled. If you set `initializeOnCreation: false`, these events will not fire until you call `initialize()` or `preload()`. Attach your event handlers before invoking those methods to avoid missing early events.

## Subscribing to Events

You can subscribe to an event by assigning a function to the player instance's corresponding property:

```typescript
import { VideoPlayer } from 'react-native-video';

const player = new VideoPlayer('https://example.com/video.mp4');

player.addEventListener('onLoad', (data) => {
  console.log('Video loaded! Duration:', data.duration);
});

player.addEventListener('onProgress', (data) => {
  console.log('Current time:', data.currentTime);
});

player.addEventListener('onError', (error) => {
  console.error('Player Error:', error.code, error.message);
});

player.play();
```

## Clearing Events

-   The `player.clearEvent(eventName)` method can be used to clear a specific native event handler.
-   When a player instance is no longer needed and `player.release()` is called, all event listeners are automatically cleared
