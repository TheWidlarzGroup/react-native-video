---
sidebar_label: Hooks
sidebar_position: 5
---

# Hooks

This library provides several React hooks to simplify `VideoPlayer` management, state handling, and event subscriptions within functional components. These hooks promote cleaner code, better resource management, and easier integration with the React component lifecycle.

## `useVideoPlayer`

The `useVideoPlayer` hook is the recommended way to create and manage `VideoPlayer` instances within your functional components.

**Purpose**:

-   Creates a `VideoPlayer` instance.
-   Automatically manages the lifecycle of the player: it creates the player when the component mounts (or the source changes) and clean up resources when the component unmounts or the source changes.
-   Recreates the player if the `source` dependency changes, ensuring the player always reflects the desired video source.

**Usage**:

```typescript
import { useVideoPlayer, VideoView } from 'react-native-video';
import React from 'react';

const MyVideoComponent = ({ videoUri }) => {
  const player = useVideoPlayer(videoUri, (playerInstance) => {
    // Optional setup function: This function is called once after the player is created.
    // You can configure the player here.
    playerInstance.loop = true;
    console.log('Player created and configured for:', videoUri);
  });

  return <VideoView player={player} controls />;
};
```

**Parameters**:

1.  `source`: `VideoConfig | VideoSource | NoAutocomplete<VideoPlayerSource>` - The video source. This can be a URL string, a `VideoSource` object, or a `VideoConfig` object.
2.  `setup?`: `(player: VideoPlayer) => void` (Optional) - A callback function that is invoked once after the `VideoPlayer` instance is created. This is a good place to set initial player properties (e.g., `loop`, `muted`, initial `volume`).

**Return Value**:

-   A `VideoPlayer` instance.

**Benefits**:

-   **Simplified Lifecycle Management**: Abstracts away the manual creation and cleanup of the `VideoPlayer`.
-   **Resource Safety**: Helps prevent resource leaks by ensuring `release()` is called at the appropriate times.
-   **Declarative**: Fits well with the React paradigm of declaring state and letting hooks manage side effects.

## `useEvent`

(Covered in detail in the [Handling Player Events](./../events/events.md) guide.)

The `useEvent` hook simplifies subscribing to `VideoPlayer` events and manages the automatic cleanup of event listeners.

**Purpose**:

-   Attaches an event listener to a `VideoPlayer` instance for a specified event.
-   Automatically removes the event listener when the component unmounts or when the hook's dependencies (`player`, `event`, `callback`) change.

**Usage**:

```typescript
import { useVideoPlayer, useEvent, VideoView } from 'react-native-video';

const EventDemo = () => {
  const player = useVideoPlayer('https://example.com/video.mp4');

  useEvent(player, 'onProgress', (data) => {
    console.log('Current time:', data.currentTime);
  });

  useEvent(player, 'onError', (error) => {
    console.error('Player error:', error.message);
  });

  return <VideoView player={player} />;
};
```

By using these hooks, you can build more robust and maintainable video playback features in your React Native application. 