---
sidebar_position: 1
sidebar_label: Player
---

# Player

The `VideoPlayer` class is the primary way to control video playback. It provides methods and properties to manage the video source, playback state, volume, and other aspects of the video.

## Initialization

To use the `VideoPlayer`, you first need to create an instance of it with a video source. There are two ways to do this. By default the native media item is initialized asynchronously right after creation (unless you opt out with `initializeOnCreation: false`).

### Using `useVideoPlayer` hook

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
  source: { uri: 'https://example.com/video.mp4' },
  // other configurations
});
```

:::warning
When using `VideoPlayer` class directly, you need to manually manage the player lifecycle. Once you no longer need the player, you need to call `release()` method to release the player's native resources. See [Player Lifecycle](./video-player.md#player-lifecycle) for more details.
:::

For detailed information about using the class, see [VideoPlayer](./video-player.md).
