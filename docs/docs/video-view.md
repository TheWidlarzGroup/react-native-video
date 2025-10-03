---
sidebar_position: 4
sidebar_label: VideoView
description: React Native Video VideoView Component
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

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `player` | `VideoPlayer` | Yes | - | The `VideoPlayer` instance that manages the video to be displayed. |
| `style` | `ViewStyle` | No | - | Standard React Native styles to control the layout and appearance of the `VideoView`. |
| `controls` | `boolean` | No | `false` | Whether to show the native video playback controls (play/pause, seek bar, volume, etc.). |
| `pictureInPicture` | `boolean` | No | `false` | Whether to enable and show the picture-in-picture (PiP) button in the native controls (if supported by the platform and controls are visible). |
| `autoEnterPictureInPicture` | `boolean` | No | `false` | Whether the video should automatically enter PiP mode when it starts playing and the app is backgrounded (behavior might vary by platform). |
| `resizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'none'` | No | `'none'` | How the video should be resized to fit the view. |
| `keepScreenAwake` | `boolean` | No | `true` | Whether to keep the device screen awake while the video view is mounted. |
| `surfaceType` | `'surface' \| 'texture'` | No (Android only) | `'surface'` | (Android) Underlying native view type. `'surface'` uses a SurfaceView (better performance, no transforms/overlap), `'texture'` uses a TextureView (supports animations, transforms, overlapping UI) at a small performance cost. Ignored on iOS. |

## Events

`VideoView` also accepts several event callback props related to UI state changes:

| Event | Type | Description |
|-------|------|-------------|
| `onPictureInPictureChange?` | `(event: { isActive: boolean }) => void` | Fired when the picture-in-picture mode starts or stops. |
| `onFullscreenChange?` | `(event: { isFullscreen: boolean }) => void` | Fired when the fullscreen mode starts or stops. |
| `willEnterFullscreen?` | `() => void` | Fired just before the view enters fullscreen mode. |
| `willExitFullscreen?` | `() => void` | Fired just before the view exits fullscreen mode. |
| `willEnterPictureInPicture?` | `() => void` | Fired just before the view enters picture-in-picture mode. |
| `willExitPictureInPicture?` | `() => void` | Fired just before the view exits picture-in-picture mode. |

These can be used to update your component's state or UI in response to these changes.

```tsx
<VideoView
  player={player}
  onFullscreenChange={({ isFullscreen }) => {
    console.log(isFullscreen ? 'Entered fullscreen' : 'Exited fullscreen');
  }}
  onPictureInPictureChange={({ isActive }) => {
    console.log(isActive ? 'PiP active' : 'PiP inactive');
  }}
/>
```

## Refs and Imperative Methods

You can obtain a ref to the `VideoView` component to call imperative methods:

```tsx
const videoViewRef = React.useRef<VideoViewRef>(null);

// ...

<VideoView ref={videoViewRef} player={player} />

// Later, you can call methods like:
videoViewRef.current?.enterFullscreen();
```

Available methods on the `VideoViewRef`:

| Method | Type | Description |
|--------|------|-------------|
| `enterFullscreen()` | `() => void` | Programmatically requests the video view to enter fullscreen mode. |
| `exitFullscreen()` | `() => void` | Programmatically requests the video view to exit fullscreen mode. |
| `enterPictureInPicture()` | `() => void` | Programmatically requests the video view to enter picture-in-picture mode. |
| `exitPictureInPicture()` | `() => void` | Programmatically requests the video view to exit picture-in-picture mode. |
| `canEnterPictureInPicture()` | `() => boolean` | Checks if picture-in-picture mode is currently available and supported. Returns `true` if PiP can be entered, `false` otherwise. |

## Android: Choosing a surface type

On Android the default rendering path uses a `SurfaceView` (set via `surfaceType="surface"`) for optimal decoding performance and lower latency. However `SurfaceView` lives in a separate window and can't be:

- Animated with transforms (scale, rotate, opacity fade)
- Clipped by parent views (rounded corners, masks)
- Overlapped reliably with sibling views (z-order issues)

If you need those UI effects, switch to `TextureView`:

```tsx
<VideoView
  player={player}
  surfaceType="texture"
  style={{ width: 300, height: 170, borderRadius: 16, overflow: 'hidden' }}
  resizeMode="cover"
  controls
/>
```

Use `TextureView` only when required, as it can be slightly less performant and may increase power consumption on some devices.