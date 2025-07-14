---
sidebar_position: 1
sidebar_label: Player
---

# VideoPlayer Overview

The `VideoPlayer` class is the primary way to control video playback. It provides methods and properties to manage the video source, playback state, volume, and other aspects of the video.

## Initialization

To use the `VideoPlayer`, you first need to create an instance of it with a video source. The source can be a URL string, a `VideoSource` object, or a `VideoConfig` object.

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

## Core Functionality

The `VideoPlayer` class offers a comprehensive set of methods and properties to control video playback:

### Playback Control

-   `play()`: Starts or resumes video playback.
-   `pause()`: Pauses video playback.
-   `seekBy(time: number)`: Seeks the video forward or backward by the specified number of seconds.
-   `seekTo(time: number)`: Seeks the video to a specific time in seconds.
-   `replaceSourceAsync(source: VideoSource | VideoConfig | null)`: Replaces the current video source with a new one. Pass `null` to release the current source without replacing it.
-   `preload()`: Preloads the video content without starting playback. This can help improve the startup time when `play()` is called.
-   `release()`: Releases the player's native resources. The player is no longer usable after calling this method. **Note:** If you intend to reuse the player instance with a different source, use `replaceSourceAsync(null)` to clear resources instead of `release()`.

### Properties

-   `source`: (Read-only) Gets the current `VideoPlayerSource` object.
-   `status`: (Read-only) Gets the current `VideoPlayerStatus` (e.g., `playing`, `paused`, `buffering`).
-   `duration`: (Read-only) Gets the total duration of the video in seconds.
-   `volume`: (Read/Write) Gets or sets the player volume (0.0 to 1.0).
-   `currentTime`: (Read/Write) Gets or sets the current playback time in seconds.
-   `muted`: (Read/Write) Gets or sets whether the video is muted.
-   `loop`: (Read/Write) Gets or sets whether the video should loop.
-   `rate`: (Read/Write) Gets or sets the playback rate (e.g., 1.0 for normal speed, 0.5 for half speed, 2.0 for double speed).
-   `isPlaying`: (Read-only) Returns `true` if the video is currently playing.

### Error Handling

-   `onError?: (error: VideoRuntimeError) => void`: A callback function that is invoked when a runtime error occurs in the player. You can use this to catch and handle errors gracefully.