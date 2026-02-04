---
sidebar_position: 4
sidebar_label: Methods
description: VideoView imperative methods
---

# Refs and Imperative Methods

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
