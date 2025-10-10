---
sidebar_position: 1
sidebar_label: Player
---

# Player

The `VideoPlayer` class is the primary way to control video playback. It provides methods and properties to manage the video source, playback state, volume, and other aspects of the video.

## Initialization

To use the `VideoPlayer`, you first need to create an instance of it with a video source. There are two ways to do this. By default the native media item is initialized asynchronously right after creation (unless you opt out with `initializeOnCreation: false`).

using `useVideoPlayer` hook
```tsx
import { useVideoPlayer } from 'react-native-video';

const player = useVideoPlayer({
  source: {
    uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
});
```

:::info
`useVideoPlayer` hook is recommended for most use cases. It automatically manages the player lifecycle between the component mount and unmount.
:::

or using `VideoPlayer` class constructor directly
```typescript
import { VideoPlayer } from 'react-native-video';

// Using a URL string
const player = new VideoPlayer('https://example.com/video.mp4');

// Using a VideoSource object
const playerWithSource = new VideoPlayer({ uri: 'https://example.com/video.mp4' });

// Using a VideoConfig object
const playerWithConfig = new VideoPlayer({
  source: { uri: 'https://example.com/video.mp4' },
  // other configurations
});
```

:::warning
When using `VideoPlayer` class directly, you need to manually manage the player lifecycle. Once you no longer need the player, you need to call `release()` method to release the player's native resources. see [Player Lifecycle](./player-lifecycle.md) for more details.
:::

## Core Functionality

The `VideoPlayer` class offers a comprehensive set of methods and properties to control video playback:

### Playback Control

| Method | Description |
|--------|-------------|
| `play()` | Starts or resumes video playback. |
| `pause()` | Pauses video playback. |
| `seekBy(time: number)` | Seeks the video forward or backward by the specified number of seconds. |
| `seekTo(time: number)` | Seeks the video to a specific time in seconds. |
| `replaceSourceAsync(source: VideoSource \| VideoConfig \| null)` | Replaces the current video source with a new one. Pass `null` to release the current source without replacing it. |
| `initialize()` | Manually initialize the underlying native player item when `initializeOnCreation` was set to `false`. No-op if already initialized. |
| `preload()` | Ensures the media source is set and prepared (buffering started) without starting playback. If not yet initialized it will initialize first. |
| `release()` | Releases the player's native resources. The player is no longer usable after calling this method. **Note:** If you intend to reuse the player instance with a different source, use `replaceSourceAsync(null)` to clear resources instead of `release()`. |

### Properties

| Property | Access | Type | Description |
|----------|--------|------|-------------|
| `source` | Read-only | `VideoPlayerSource` | Gets the current `VideoPlayerSource` object. |
| `status` | Read-only | `VideoPlayerStatus` | Gets the current status (e.g., `playing`, `paused`, `buffering`). |
| `duration` | Read-only | `number` | Gets the total duration of the video in seconds. Returns `NaN` until metadata is loaded. |
| `volume` | Read/Write | `number` | Gets or sets the player volume (0.0 to 1.0). |
| `currentTime` | Read/Write | `number` | Gets or sets the current playback time in seconds. |
| `muted` | Read/Write | `boolean` | Gets or sets whether the video is muted. |
| `loop` | Read/Write | `boolean` | Gets or sets whether the video should loop. |
| `rate` | Read/Write | `number` | Gets or sets the playback rate (e.g., 1.0 for normal speed, 0.5 for half speed, 2.0 for double speed). |
| `mixAudioMode` | Read/Write | `MixAudioMode` | Controls how this player's audio mixes with other audio sources (see [MixAudioMode](../api-reference/type-aliases/MixAudioMode.md)). |
| `ignoreSilentSwitchMode` | Read/Write | `IgnoreSilentSwitchMode` | iOS-only. Determines how audio should behave when the hardware mute (silent) switch is on. |
| `playInBackground` | Read/Write | `boolean` | Whether playback should continue when the app goes to the background. |
| `playWhenInactive` | Read/Write | `boolean` | Whether playback should continue when the app is inactive (e.g., during a phone call). |
| `isPlaying` | Read-only | `boolean` | Returns `true` if the video is currently playing. |
| `selectedTrack` | Read-only | `TextTrack \| undefined` | Currently selected text track, or `undefined` when no track is selected. |

### Error Handling

| Property | Type | Description |
|----------|------|-------------|
| `onError?` | `(error: VideoRuntimeError) => void` | A callback function that is invoked when a runtime error occurs in the player. You can use this to catch and handle errors gracefully. |

### Buffer Config

You can fine‑tune buffering via `bufferConfig` on the `VideoConfig` you pass to `useVideoPlayer`/`VideoPlayer`. This controls how much data is buffered, live latency targets, and iOS network constraints.

Example

```ts
const player = useVideoPlayer({
  source: {
    uri: 'https://example.com/stream.m3u8',
    bufferConfig: {
      // Android
      minBufferMs: 5000,
      maxBufferMs: 10000,
      // iOS
      preferredForwardBufferDurationMs: 3000,
      // Live (cross‑platform target)
      livePlayback: { targetOffsetMs: 500 },
    },
  },
});
```

#### Android
Properties below are Android‑only

| Property | Type | Description |
|----------|------|-------------|
| `minBufferMs` | `number` | Minimum media duration the player attempts to keep buffered (ms). Default: 5000. |
| `maxBufferMs` | `number` | Maximum media duration the player attempts to buffer (ms). Default: 10000. |
| `bufferForPlaybackMs` | `number` | Media that must be buffered before playback can start or resume after user action (ms). Default: 1000. |
| `bufferForPlaybackAfterRebufferMs` | `number` | Media that must be buffered to resume after a rebuffer (ms). Default: 2000. |
| `backBufferDurationMs` | `number` | Duration kept behind the current position to allow instant rewind without rebuffer (ms). |
| `livePlayback.minPlaybackSpeed` | `number` | Minimum playback speed used to maintain target live offset. |
| `livePlayback.maxPlaybackSpeed` | `number` | Maximum playback speed used to catch up to target live offset. |
| `livePlayback.minOffsetMs` | `number` | Minimum allowed live offset (ms). |
| `livePlayback.maxOffsetMs` | `number` | Maximum allowed live offset (ms). |
| `livePlayback.targetOffsetMs` | `number` | Target live offset the player tries to maintain (ms). |

#### iOS, visionOS, tvOS
Properties below are Apple platforms‑only

| Property | Type | Description |
|----------|------|-------------|
| `preferredForwardBufferDurationMs` | `number` | Preferred duration the player attempts to retain ahead of the playhead (ms). |
| `preferredPeakBitRate` | `number` | Desired limit of network bandwidth for loading the current item (bits per second). |
| `preferredMaximumResolution` | `{ width: number; height: number }` | Preferred maximum video resolution. |
| `preferredPeakBitRateForExpensiveNetworks` | `number` | Bandwidth limit for expensive networks (e.g., cellular), in bits per second. |
| `preferredMaximumResolutionForExpensiveNetworks` | `{ width: number; height: number }` | Preferred maximum resolution on expensive networks. |
| `livePlayback.targetOffsetMs` | `number` | Target live offset (ms) the player will try to maintain. |

## DRM

Protected content is supported via a plugin. See the full DRM guide: [DRM](./drm.md).

Quick notes:
- Install and enable the official plugin `@react-native-video/drm` and call `enable()` at app startup before creating players.
- Pass DRM configuration on the source using the `drm` property of `VideoConfig` (see the DRM guide for platform specifics and `getLicense` examples).
- If you defer initialization (`initializeOnCreation: false`), be sure to call `await player.initialize()` (or `preload()`) before expecting DRM license acquisition events.