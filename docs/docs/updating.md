---
title: Updating
description: React Native Video Updating Guide
sidebar_class_name: hidden
---

## Upgrading from react-native-video v6 to v7

Version 7 of `react-native-video` introduces a significant architectural shift, separating the video player logic from the UI rendering. This change unlocks new capabilities like video preloading and a more intuitive, hook-based API. This guide will walk you through the necessary steps to migrate your application from v6 to v7.

### Key Changes in v7

The most substantial change in v7 is the move from a monolithic `<Video>` component to a more modular approach with two distinct components:

*   **`VideoPlayer`**: A new class that manages the player's state and playback logic. It is not a UI component.
*   **`VideoView`**: A UI component responsible for rendering the video on the screen. It takes a `VideoPlayer` instance as a prop.
*   **`useVideoPlayer` hook**: The recommended way to create and manage the lifecycle of a `VideoPlayer` instance within a functional component. It automatically handles the creation and cleanup of the player.

### New Dependency
`react-native-video` v7 is now built on top of [`react-native-nitro-modules`](https://nitro.margelo.com/docs/what-is-nitro) framework. This means that you need to install the Nitro framework to use `react-native-video` v7.

### Step-by-Step Migration Guide

#### 1. Installation

First, update the `react-native-video` package to the latest v7 release:

```bash
npm install react-native-video@next --save
```

Then, install the pods for iOS:

```bash
cd ios && pod install
```

#### 2. Updating Your Component

The core of the migration involves replacing the `<Video>` component with the new `useVideoPlayer` hook and `<VideoView>` component.

**v6 Implementation:**

```jsx
import React, { useRef } from 'react';
import Video from 'react-native-video';

const VideoPlayerV6 = () => {
  const videoRef = useRef(null);

  return (
    <Video
      source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
      ref={videoRef}
      style={{ width: 300, height: 200 }}
      controls={true}
      onLoad={() => console.log('Video loaded')}
      onProgress={(data) => console.log('Progress:', data.currentTime)}
    />
  );
};
```

**v7 Implementation:**

```jsx
import React from 'react';
import { useVideoPlayer, VideoView, useEvent } from 'react-native-video';

const VideoPlayerV7 = () => {
  const player = useVideoPlayer({
    source: {
      uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  });

  useEvent(player, 'onLoad', () => {
    console.log('Video loaded');
  });

  useEvent(player, 'onProgress', (data) => {
    console.log('Progress:', data.currentTime);
  });

  return (
    <VideoView
      player={player}
      style={{ width: 300, height: 200 }}
      controls={true}
    />
  );
};
```

### Prop and Method Migration

Many props and methods from the v6 `<Video>` component have been moved to the `VideoPlayer` instance in v7.

#### Common Props

| v6 Prop (`<Video>`) | v7 Equivalent (`VideoPlayer` properties) | Notes |
| :--- | :--- | :--- |
| `source` | `source` property in `useVideoPlayer` config | The structure of the source object remains largely the same. |
| `paused` | `paused` property on the `VideoPlayer` instance | Can be controlled via `player.pause()` and `player.play()`. |
| `muted` | `muted` property on the `VideoPlayer` instance | `player.muted = true/false;` |
| `volume` | `volume` property on the `VideoPlayer` instance | `player.volume = 0.5;` |
| `rate` | `rate` property on the `VideoPlayer` instance | `player.rate = 1.5;` |
| `loop` | `loop` property on the `VideoPlayer` instance | `player.loop = true;` |
| `resizeMode` | `resizeMode` prop on `<VideoView>` | This remains a prop on the UI component. |
| `controls` | `controls` prop on `<VideoView>` | This also remains on the UI component. |

see [VideoPlayer](./player/player.md) for more details.

#### Methods

Imperative methods previously called on the `<Video>` component's ref are now methods on the `VideoPlayer` instance.

| v6 Method (`videoRef.current`) | v7 Equivalent (`player`) |
| :--- | :--- |
| `seek(time)` | `player.seekTo(time)` |
| `presentFullscreenPlayer()` | `videoViewRef.current.enterFullscreen()` | Fullscreen is now managed by the `VideoView` ref. |
| `dismissFullscreenPlayer()` | `videoViewRef.current.exitFullscreen()` | |
| `pause()` | `player.pause()` | |
| `resume()` | `player.play()` | |

see [VideoPlayer](./player/player.md) for more details.

### Event Handling

In v7, event handling is standardized through the `useEvent` hook or by directly assigning callbacks to the `VideoPlayer` instance. The `useEvent` hook is recommended as it automatically handles listener cleanup.

**v6 Event Handling:**

```jsx
<Video
  onLoad={(data) => console.log(data)}
  onProgress={(data) => console.log(data.currentTime)}
  onError={(error) => console.error(error)}
/>
```

**v7 Event Handling with `useEvent`:**

```jsx
import { useVideoPlayer, VideoView, useEvent } from 'react-native-video';

const MyPlayer = () => {
  const player = useVideoPlayer({ source: { uri: '...' } });

  useEvent(player, 'onLoad', (data) => console.log(data));
  useEvent(player, 'onProgress', (data) => console.log(data.currentTime));
  useEvent(player, 'onError', (error) => console.error(error.code, error.message));

  return <VideoView player={player} />;
}
```

**Directly assigning callbacks in v7:**

```jsx
const player = useVideoPlayer('https://example.com/video.mp4', (_player) => {
  _player.onLoad = (data) => {
    console.log('Video loaded! Duration:', data.duration);
  };
  _player.onError = (error) => {
    console.error('Player Error:', error.code, error.message);
  };
});
```

### Benefits of the New Architecture

*   **Preloading**: You can create a `VideoPlayer` instance and begin loading a video before it's visible in the UI. When you're ready to display it, simply pass the player instance to a `<VideoView>`.
*   **Improved Performance**: Separating the player logic from the UI rendering can lead to better performance and a more responsive application.
*   **Cleaner API**: The hook-based API simplifies player management and reduces boilerplate code, especially for handling the player's lifecycle.
*   **Full New Architecture Support**: Version 7 fully embraces React Native's New Architecture, ensuring better performance and consistency.