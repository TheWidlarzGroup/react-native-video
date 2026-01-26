---
sidebar_position: 3
sidebar_label: VideoPlayer
---

# VideoPlayer

:::tip When to Use What
- **[`useVideoPlayer`](./use-video-player.md) hook** — Recommended for most cases. Automatically manages player lifecycle (creation, cleanup on unmount, source changes).
- **`VideoPlayer` class** — Use when you need manual lifecycle control, e.g., preloading videos before displaying them, managing multiple players with custom logic, or deferred initialization scenarios.
:::

The `VideoPlayer` class is the primary way to control video playback. It provides methods and properties to manage the video source, playback state, volume, and other aspects of the video.

## Initialization

To use the `VideoPlayer`, you first need to create an instance of it with a video source. By default the native media item is initialized asynchronously right after creation (unless you opt out with `initializeOnCreation: false`).

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
When using `VideoPlayer` class directly, you need to manually manage the player lifecycle. Once you no longer need the player, you need to call `release()` method to release the player's native resources. See the [Player Lifecycle](#player-lifecycle) section below for more details.
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
const player = new VideoPlayer({
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

## Player Lifecycle

Understanding the lifecycle of the `VideoPlayer` is crucial for managing resources effectively and ensuring a smooth user experience.

### Creation and Initialization

1. **Instantiation**: A `VideoPlayer` instance is created by calling its constructor with a video source (URL, `VideoSource`, or `VideoConfig`).
    ```typescript
    const player = new VideoPlayer('https://example.com/video.mp4');
    ```
2. **Native Player Allocation**: A lightweight native player object is allocated immediately.
3. **Asset Initialization**: By default (unless you opt out) the underlying media item is prepared **asynchronously right after creation**. You can control this with `initializeOnCreation` inside `VideoConfig`.

#### Deferred Initialization (Advanced)

If you pass a `VideoConfig` with `{ initializeOnCreation: false }`, the player will skip preparing the media item automatically. This is useful when:

- You need to batch‑create many players without incurring immediate decoding / network cost
- You want to attach event handlers before any network requests happen
- You want explicit control over when buffering begins (e.g. on user interaction)

To initialize later, call:
```ts
await player.initialize();
// or preload if you also want it prepared & ready
await player.preload();
```

#### Initialization Methods Comparison

| Method | When to use | What it does |
|--------|-------------|--------------|
| `initialize()` | You deferred initialization and now want to create the native player item / media source | Creates & attaches the underlying player item / media source without starting playback |
| `preload()` | You want the player item prepared (buffering kicked off) ahead of an upcoming `play()` call | Ensures the media source is set and prepared; resolves once preparation started (may already be initialized) |
| Implicit (default) | `initializeOnCreation` not set or `true` | Automatically schedules initialization after JS construction |

:::info
By default, the player initializes automatically after construction. If you need to defer initialization, set `initializeOnCreation: false` in the config. You can then call `player.initialize()` or `player.preload()` later to start the player.
:::

### Playing a Video

1.  **Loading**: When the player (auto) initializes, `preload()` is called, or after `replaceSourceAsync()`, the player starts loading the video metadata and buffering content.
    -   `onLoadStart`: Fired when the video starts loading.
    -   `onLoad`: Fired when the video metadata is loaded and the player is ready to play (duration, dimensions, etc., are available).
    -   `onBuffer`: Fired when buffering starts or ends.
2.  **Playback**: Once enough data is buffered, playback begins.
    -   `onPlaybackStateChange`: Fired when the playback state changes (e.g., from `buffering` to `playing`).
    -   `onProgress`: Fired periodically with the current playback time.
    -   `onReadyToDisplay`: Fired when the first frame is ready to be displayed.

### Controlling Playback

-   `pause()`: Pauses playback. `status` changes to `paused`.
-   `seekTo(time)`, `seekBy(time)`: Changes the current playback position. `onSeek` is fired when the seek operation completes.
-   `set volume(value)`, `set muted(value)`, `set loop(value)`, `set rate(value)`: Modify player properties. Corresponding events like `onVolumeChange` or `onPlaybackRateChange` might be fired.

### Changing Source

-   `replaceSourceAsync(newSource)`: This method allows you to change the video source dynamically.
    1.  The current native player resources associated with the old source are released (similar to `release()` but specifically for the source).
    2.  A new native player instance (or reconfigured existing one) is prepared for the `newSource`.
    3.  The loading lifecycle events (`onLoadStart`, `onLoad`, etc.) will fire for the new source.
-   `replaceSourceAsync(null)`: This effectively unloads the current video and releases its associated resources without loading a new one. This is useful for freeing up memory if the player is temporarily not needed but might be used again later.

### Releasing Resources

There are two main ways to release resources:

1.  **`replaceSourceAsync(null)`**: This is a less destructive way to free resources related *only* to the current video source.
    -   The `VideoPlayer` instance itself remains usable.
    -   You can later call `replaceSourceAsync(newSource)` to load and play a new video.

2.  **`release()`**: This is a destructive operation.
   
:::danger
After calling `release()`, the player instance becomes unusable. Any subsequent calls to its methods or property access will result in errors.
:::

:::tip
It is recommended to use `replaceSourceAsync(null)` when you want to free resources related to the current video source. You should call `release()` only when you are 100% sure that you don't need the player instance anymore. Anyway garbage collector will release the player instance when it is no longer needed.
:::

### Error Handling

-   The `onError` callback, if provided, will be called when a `VideoRuntimeError` occurs. This allows you to handle issues like network errors, invalid source, or platform-specific playback problems.
-   If `onError` is not provided, errors might be thrown as exceptions.

### Using with Hooks (`useVideoPlayer`)

The `useVideoPlayer` hook simplifies managing the `VideoPlayer` lifecycle within React components.

```typescript
import { useVideoPlayer } from 'react-native-video';

const MyComponent = () => {
  const player = useVideoPlayer('https://example.com/video.mp4', (playerInstance) => {
    // Optional setup function: configure the player instance after creation
    playerInstance.loop = true;
  });

  // ... use player ...

  return <VideoView player={player} />;
};
```

-   **Automatic Creation**: `useVideoPlayer` creates a `VideoPlayer` instance when the component mounts or when the source dependency changes.
-   **Automatic Cleanup**: It automatically cleanup resources when the component unmounts or before recreating the player due to a source change. This prevents resource leaks.
-   **Dependency Management**: If the `source` prop passed to `useVideoPlayer` changes, the hook will clean up the old player instance and create a new one with the new source.

:::tip
Using `useVideoPlayer` is the recommended way to manage `VideoPlayer` instances in functional components to ensure proper lifecycle management and resource cleanup. It will also respect `initializeOnCreation` (defaults to `true`). If you need deferred initialization with the hook:

```tsx
const player = useVideoPlayer({
    source: { uri: 'https://example.com/video.mp4' },
    initializeOnCreation: false,
}, (instance) => {
    // Attach listeners first
    instance.onLoad = () => console.log('Loaded');
});

// Later (e.g. on user tap)
await player.initialize(); // or player.preload()
player.play();
```
:::
