---
sidebar_label: Player Lifecycle
sidebar_position: 2
---

# Player Lifecycle

Understanding the lifecycle of the `VideoPlayer` is crucial for managing resources effectively and ensuring a smooth user experience.

## Creation and Initialization

1. **Instantiation**: A `VideoPlayer` instance is created by calling its constructor with a video source (URL, `VideoSource`, or `VideoConfig`).
    ```typescript
    const player = new VideoPlayer('https://example.com/video.mp4');
    ```
2. **Native Player Allocation**: A lightweight native player object is allocated immediately.
3. **Asset Initialization**: By default (unless you opt out) the underlying media item is prepared **asynchronously right after creation**. You can control this with `initializeOnCreation` inside `VideoConfig`.

### Deferred Initialization (Advanced)

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

### Initialization Methods Comparison

| Method | When to use | What it does |
|--------|-------------|--------------|
| `initialize()` | You deferred initialization and now want to create the native player item / media source | Creates & attaches the underlying player item / media source without starting playback |
| `preload()` | You want the player item prepared (buffering kicked off) ahead of an upcoming `play()` call | Ensures the media source is set and prepared; resolves once preparation started (may already be initialized) |
| Implicit (default) | `initializeOnCreation` not set or `true` | Automatically schedules initialization after JS construction |

:::info
By default, the player initializes automatically after construction. If you need to defer initialization, set `initializeOnCreation: false` in the config. You can then call `player.initialize()` or `player.preload()` later to start the player.
:::

## Playing a Video

1.  **Loading**: When the player (auto) initializes, `preload()` is called, or after `replaceSourceAsync()`, the player starts loading the video metadata and buffering content.
    -   `onLoadStart`: Fired when the video starts loading.
    -   `onLoad`: Fired when the video metadata is loaded and the player is ready to play (duration, dimensions, etc., are available).
    -   `onBuffer`: Fired when buffering starts or ends.
2.  **Playback**: Once enough data is buffered, playback begins.
    -   `onPlaybackStateChange`: Fired when the playback state changes (e.g., from `buffering` to `playing`).
    -   `onProgress`: Fired periodically with the current playback time.
    -   `onReadyToDisplay`: Fired when the first frame is ready to be displayed.

## Controlling Playback

-   `pause()`: Pauses playback. `status` changes to `paused`.
-   `seekTo(time)`, `seekBy(time)`: Changes the current playback position. `onSeek` is fired when the seek operation completes.
-   `set volume(value)`, `set muted(value)`, `set loop(value)`, `set rate(value)`: Modify player properties. Corresponding events like `onVolumeChange` or `onPlaybackRateChange` might be fired.

## Changing Source

-   `replaceSourceAsync(newSource)`: This method allows you to change the video source dynamically.
    1.  The current native player resources associated with the old source are released (similar to `release()` but specifically for the source).
    2.  A new native player instance (or reconfigured existing one) is prepared for the `newSource`.
    3.  The loading lifecycle events (`onLoadStart`, `onLoad`, etc.) will fire for the new source.
-   `replaceSourceAsync(null)`: This effectively unloads the current video and releases its associated resources without loading a new one. This is useful for freeing up memory if the player is temporarily not needed but might be used again later.

## Releasing Resources

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

## Error Handling

-   The `onError` callback, if provided, will be called when a `VideoRuntimeError` occurs. This allows you to handle issues like network errors, invalid source, or platform-specific playback problems.
-   If `onError` is not provided, errors might be thrown as exceptions.

## Using with Hooks (`useVideoPlayer`)

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