---
title: Player — Playback Control & Lifecycle
sidebar_position: 1
sidebar_label: Player
description: Learn how to use the VideoPlayer class in React Native Video v7 to control video playback, manage sources, and handle player lifecycle.
keywords: [react native video, video player, VideoPlayer, mobile video, react native]
---

# Player

The `VideoPlayer` class is the primary way to control video playback. It provides methods and properties to manage the video source, playback state, volume, and other aspects of the video.

## Initialization

To use the `VideoPlayer`, you first need to create an instance of it with a video source. There are two ways to do this. By default the native media item is initialized asynchronously right after creation (unless you opt out with `initializeOnCreation: false`).

### Using `useVideoPlayer` hook

```tsx
import { useVideoPlayer } from 'react-native-video';

const player = useVideoPlayer({
  uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
});
```

:::info
`useVideoPlayer` hook is recommended for most use cases. It automatically manages the player lifecycle between the component mount and unmount.
:::

For detailed information about using the hook, see [useVideoPlayer](./use-video-player.md).

### Using `VideoPlayer` class constructor directly

```typescript
import { VideoPlayer } from 'react-native-video';

// Using a URL string
const player = new VideoPlayer('https://example.com/video.mp4');

// Using a VideoSource object
const playerWithSource = new VideoPlayer({ uri: 'https://example.com/video.mp4' });

// Using a VideoConfig object
const playerWithConfig = new VideoPlayer({
  uri: 'https://example.com/video.mp4',
  // other configurations
});
```

:::warning
When using `VideoPlayer` class directly, you need to manually manage the player lifecycle. Once you no longer need the player, you need to call `release()` method to release the player's native resources. See [Player Lifecycle](./video-player.md#player-lifecycle) for more details.
:::

For detailed information about using the class, see [VideoPlayer](./video-player.md).

## Time units

Positions and lengths of the video are in **seconds**, as on the web `<video>` element and in v6:

- `player.currentTime`, `player.duration`, `player.seekTo()` and `player.seekBy()`
- `currentTime`, `duration` and `bufferDuration` in the `onProgress` and `onLoad` events, and the position passed to `onSeek`
- `duration` returned by `source.getAssetInformationAsync()`

Options that configure loading and buffering are in **milliseconds**, as in v6. The `bufferConfig` fields show it in their names, which end with `Ms`.

A length that is not known yet is `NaN` for `player.duration` and the events, and `-1` for `getAssetInformationAsync()`.
