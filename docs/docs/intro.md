---
sidebar_position: 1
description: Introduction to React Native Video library
---

# Intro

**One of the most popular video playback libraries for React Native applications.**

`react-native-video` provides a comprehensive solution for video playback in React Native, built on top of [`react-native-nitro-modules`](https://nitro.margelo.com/docs/what-is-nitro) framework. Whether you're building a video streaming app, media player, or educational platform, `react-native-video` gives you the tools you need to create exceptional video experiences.

## Why Choose `react-native-video`?

### Native Performance
`react-native-video` is built with native video players (AVPlayer on iOS, ExoPlayer on Android) to ensure hardware-accelerated playback for smooth performance. The library includes optimized memory management and resource handling to provide the best possible user experience.

### Rich Feature Set
The library offers advanced playback controls including play, pause, seek, volume control, and playback rate adjustment. It supports multiple source types including HTTP/HTTPS streams, local files, HLS, and DASH. `react-native-video` includes subtitle support for both built-in and external subtitle files (WebVTT, SRT), native Picture-in-Picture support on both platforms, background audio playback and native fullscreen implementation.

### Developer Experience
`react-native-video` is TypeScript-first with full TypeScript support and comprehensive type definitions. It provides intuitive React hooks for easy integration. The library is compatible with React Native's New Architecture and works seamlessly with Expo managed and bare workflows.

## Quick Start

Get started in minutes with a simple video player:

```bash
npm install react-native-video@next react-native-nitro-modules
```

```tsx
import { VideoView, useVideoPlayer } from 'react-native-video';

export default function App() {
  const player = useVideoPlayer({
    uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
  });

  return <VideoView player={player} />;
}
```

## What's Next?

- **[Installation Guide](./installation.md)** - Get started with `react-native-video`
- **[VideoPlayer](./player/player.md)** - Learn about the core player functionality
- **[VideoView Component](./video-view.md)** - Understand the video display component
- **[Event Handling](./events/events.md)** - Master player events and callbacks
- **[Configuration](./configuration/expo-plugin.md)** - Configure the player
- **[API Reference](./api-reference/index.md)** - Complete API documentation

[![React Native Video](../static/baners/rnv-banner.png)](https://www.thewidlarzgroup.com/react-native-video/?utm_source=rnv&utm_medium=docs&utm_campaign=intro&utm_id=rnv-banner)

