---
sidebar_position: 2
sidebar_label: VideoView
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
  const player = useVideoPlayer('https://example.com/video.mp4');

  React.useEffect(() => {
    player.play();
  }, [player]);

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
    width: 300,
    height: 200,
  },
});

export default App;
```

## Props

-   **`player`**: (Required) The `VideoPlayer` instance that manages the video to be displayed.
-   **`style?`**: `ViewStyle` - Standard React Native styles to control the layout and appearance of the `VideoView`.
-   **`controls?`**: `boolean` (default: `false`) - Whether to show the native video playback controls (play/pause, seek bar, volume, etc.).
-   **`pictureInPicture?`**: `boolean` (default: `false`) - Whether to enable and show the picture-in-picture (PiP) button in the native controls (if supported by the platform and controls are visible).
-   **`autoEnterPictureInPicture?`**: `boolean` (default: `false`) - Whether the video should automatically enter PiP mode when it starts playing and the app is backgrounded (behavior might vary by platform).

### Event Props

`VideoView` also accepts several event callback props related to UI state changes:

-   **`onPictureInPictureChange?`**: `(event: { isActive: boolean }) => void` - Fired when the picture-in-picture mode starts or stops.
-   **`onFullscreenChange?`**: `(event: { isFullscreen: boolean }) => void` - Fired when the fullscreen mode starts or stops.
-   **`willEnterFullscreen?`**: `() => void` - Fired just before the view enters fullscreen mode.
-   **`willExitFullscreen?`**: `() => void` - Fired just before the view exits fullscreen mode.
-   **`willEnterPictureInPicture?`**: `() => void` - Fired just before the view enters picture-in-picture mode.
-   **`willExitPictureInPicture?`**: `() => void` - Fired just before the view exits picture-in-picture mode.

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

-   **`enterFullscreen()`**: Programmatically requests the video view to enter fullscreen mode.
-   **`exitFullscreen()`**: Programmatically requests the video view to exit fullscreen mode.
-   **`enterPictureInPicture()`**: Programmatically requests the video view to enter picture-in-picture mode.
-   **`exitPictureInPicture()`**: Programmatically requests the video view to exit picture-in-picture mode.
-   **`canEnterPictureInPicture()`**: `() => boolean` - Checks if picture-in-picture mode is currently available and supported. Returns `true` if PiP can be entered, `false` otherwise.

Ensure your app is correctly linked (run `pod install` on iOS, rebuild the app) if you encounter linking errors. 