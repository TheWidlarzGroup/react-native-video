---
title: VideoView — Native Video Rendering Component
sidebar_position: 1
sidebar_label: Introduction
description: Render video content with the VideoView component — native controls, fullscreen, and picture-in-picture support in React Native Video.
keywords: [VideoView, component, video rendering, native controls, fullscreen, picture-in-picture, react native video]
---

# VideoView Component

The `VideoView` component is responsible for rendering the video content managed by a `VideoPlayer` instance onto the screen. It also provides UI functionalities like native controls, fullscreen, and picture-in-picture mode.

## Basic Usage

To use `VideoView`, you need to pass a `VideoPlayer` instance to its `player` prop.

```tsx
import React from 'react';
import { VideoPlayer, VideoView } from 'react-native-video';
import { StyleSheet } from 'react-native';

const App = () => {
  const player = useVideoPlayer('https://example.com/video.mp4', (_player) => {
    // This is optional setup function that will be called when the player is created.
    _player.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      controls={true}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: 200,
  },
});

export default App;
```
