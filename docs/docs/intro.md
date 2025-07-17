---
sidebar_position: 1
description: Introduction to React Native Video library
---

# Intro

![React Native Video](../static/baners/rnv-banner.png)

**The powerful and feature-rich video playback library for React Native applications.**

React Native Video provides a comprehensive solution for video playback in React Native, built on top of the blazing-fast [`react-native-nitro-modules`](https://nitro.margelo.com/docs/what-is-nitro) framework. Whether you're building a video streaming app, media player, or educational platform, React Native Video gives you the tools you need to create exceptional video experiences.

## Why Choose React Native Video?

### Native Performance
React Native Video is built with native video players (AVPlayer on iOS, ExoPlayer on Android) to ensure hardware-accelerated playback for smooth performance. The library includes optimized memory management and resource handling to provide the best possible user experience.

### Rich Feature Set
The library offers advanced playback controls including play, pause, seek, volume control, and playback rate adjustment. It supports multiple source types including HTTP/HTTPS streams, local files, HLS, and DASH. React Native Video includes subtitle support for both built-in and external subtitle files (WebVTT, SRT), native Picture-in-Picture support on both platforms, background audio playback and native fullscreen implementation.

### Developer Experience
React Native Video is TypeScript-first with full TypeScript support and comprehensive type definitions. It provides intuitive React hooks for easy integration. The library is compatible with React Native's New Architecture and works seamlessly with Expo managed and bare workflows.

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

- **[Installation Guide](./installation.md)** - Get started with React Native Video
- **[VideoPlayer](./player/player.md)** - Learn about the core player functionality
- **[VideoView Component](./video-view.md)** - Understand the video display component
- **[Event Handling](./events/events.md)** - Master player events and callbacks
- **[API Reference](../api-reference/index.md)** - Complete API documentation

