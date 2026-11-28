---
title: Player Events — onLoad, onProgress, onError
sidebar_label: Events
sidebar_position: 5
description: Handle video player events like onLoad, onProgress, onError, and onEnd using the useEvent hook in React Native Video.
keywords: [video events, onLoad, onProgress, onError, onEnd, useEvent, event handling, react native video]
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

The `VideoPlayer` class, through `VideoPlayerEvents`, supports the following events. Subscribe with `player.addEventListener(event, callback)` or, in a component, with the [`useEvent`](#using-the-useevent-hook) hook.

| Event                      | Callback Signature                                      | Description                                                                                 |
|----------------------------|--------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `onAudioBecomingNoisy`     | () => void                                           | Fired when audio is about to become noisy (e.g., headphones unplugged).                     |
| `onAudioFocusChange`       | (hasAudioFocus: boolean) => void                     | Fired when the audio focus changes (e.g., another app starts playing audio).                |
| `onBandwidthUpdate`        | (data: [BandwidthData](../api-reference/interfaces/BandwidthData.md)) => void                        | Fired with an estimate of the available bandwidth.                                          |
| `onBuffer`                 | (buffering: boolean) => void                         | Fired when the player starts or stops buffering data.                                       |
| `onControlsVisibleChange`  | (visible: boolean) => void                           | Fired when the visibility of native controls changes.                                       |
| `onEnd`                    | () => void                                           | Fired when the video playback reaches the end.                                              |
| `onExternalPlaybackChange` | (externalPlaybackActive: boolean) => void            | Fired when the external playback status changes (e.g., AirPlay).                            |
| `onLoad`                   | (data: [onLoadData](../api-reference/interfaces/onLoadData.md)) => void                           | Fired once per source, when the video has loaded and is ready to play. A seek or a rebuffer does not fire it again; loading the source again after an error does.                                       |
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
| `onVideoTrackChange`       | (data: [VideoTrackChangeData](../api-reference/interfaces/VideoTrackChangeData.md)) => void | Fired when the list of video renditions, the pinned rendition or the one being played changes. See [Video quality](./video-quality.md). |
| `onVolumeChange`           | (data: [onVolumeChangeData](../api-reference/interfaces/onVolumeChangeData.md)) => void     | Fired when the volume changes.                                                              |

`onError` is subscribed the same way, `player.addEventListener('onError', (error) => …)`:

-   `onError: (error: ` [VideoRuntimeError](../api-reference/interfaces/VideoRuntimeError.md) `) => void` - Fired when an error occurs. The callback receives the `VideoRuntimeError` object; see [Errors](./errors.md) for every `code`.
    `onError` also fires when the source fails to load asynchronously (e.g. HTTP 404) or playback fails, with code `player/playback-failed` on iOS and Android; `onStatusChange('error')` fires as well. On web these failures carry a `web/*` code instead (`web/aborted`, `web/network`, `web/decode`, `web/unsupported-source`), or `unknown/unknown` when the browser reports no known cause.

**Benefits of `useEvent`**:

-   **Automatic Cleanup**: The event listener is automatically removed when the component unmounts or when the `player`, `event`, or `callback` dependencies change, preventing memory leaks.
-   **Type Safety**: Provides better type inference for event callback parameters.

This hook is recommended for managing event subscriptions in a declarative React style. 

### Initialization Timing and Events

`onLoadStart` / `onLoad` will fire automatically after construction when `initializeOnCreation` (default `true`) is enabled. If you set `initializeOnCreation: false`, these events will not fire until you call `initialize()` or `preload()`. Attach your event handlers before invoking those methods to avoid missing early events.

A listener added while a source is still loading receives `onLoadStart` for that load right away. If your code removes a listener and adds it again during loading (for example in a `useEffect` whose dependencies change), it receives `onLoadStart` for the same load a second time, so deduplicate there if you count load starts. `useEvent` keeps one subscription per player and event and is not affected.

## Event data

A few fields of the event data that are easy to miss:

| Event | Field | Description |
|-------|-------|-------------|
| `onLoad` | `currentTime`, `duration` | Seconds. `duration` is `NaN` while unknown, for example for some live streams. |
| `onLoad` | `width`, `height` | Size of the video in pixels. |
| `onLoad` | `orientation` | `'portrait'`, `'landscape'`, `'portrait-upside-down'`, `'landscape-left'`, `'landscape-right'`, `'square'` or `'unknown'`. |
| `onLoadStart` | `sourceType` | `'network'` for an `http(s)` source, `'local'` for a file or a bundled asset. |
| `onLoadStart` | `source` | The `VideoPlayerSource` that started loading. |
| `onPlaybackStateChange` | `isPlaying`, `isBuffering` | Both are reported together, so one listener can drive a play/pause button and a loading indicator. |
| `onProgress` | `currentTime` | Seconds. |
| `onProgress` | `bufferDuration` | Seconds of media buffered ahead of `currentTime`. |

## Subscribing to Events

You can subscribe to an event by passing a callback to `addEventListener`. It returns a subscription; call `remove()` on it to stop listening:

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

-   `addEventListener` returns a subscription: `subscription.remove()` removes that one listener.
-   `player.clearAllEvents()` removes every listener of the player, native and JS (including `onError`).
-   When a player instance is no longer needed and `player.release()` is called, all event listeners are automatically cleared.

```typescript
import { VideoPlayer } from 'react-native-video';

const player = new VideoPlayer('https://example.com/video.mp4');

const subscription = player.addEventListener('onEnd', () => {
  console.log('Finished');
});

// Later
subscription.remove();
```
