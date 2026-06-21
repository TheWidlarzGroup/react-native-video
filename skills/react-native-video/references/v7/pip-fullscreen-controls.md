# v7 — Picture-in-Picture, fullscreen, controls

These live on the **`VideoView`** (props + imperative ref), not the player.

## Native controls

```tsx
<VideoView player={player} controls />   // controls defaults to false
```

## Picture-in-Picture

Props:

```tsx
<VideoView player={player} pictureInPicture autoEnterPictureInPicture />
```

Imperative (via a ref):

```tsx
import { useRef } from 'react';
import type { VideoViewRef } from 'react-native-video';

const ref = useRef<VideoViewRef>(null);
// ref.current?.canEnterPictureInPicture()
// ref.current?.enterPictureInPicture()
// ref.current?.exitPictureInPicture()
<VideoView ref={ref} player={player} pictureInPicture />
```

Android needs `android:supportsPictureInPicture="true"` on the activity and `minSdkVersion 26` (Expo: `enableAndroidPictureInPicture`). See `../shared/platform-setup.md`.

> **PiP testing:** not supported on the **iOS Simulator** — test on a real iOS device. PiP *does* work on the **Android emulator** (API 26+, Google Play image).

## Fullscreen

```tsx
ref.current?.enterFullscreen();
ref.current?.exitFullscreen();
```

## Lifecycle events

On the view (props or `ref.addEventListener`):

| Event | Payload |
|---|---|
| `onFullscreenChange` | `fullscreen: boolean` |
| `onPictureInPictureChange` | `isInPictureInPicture: boolean` |
| `willEnterFullscreen` / `willExitFullscreen` | — |
| `willEnterPictureInPicture` / `willExitPictureInPicture` | — |

```tsx
<VideoView
  ref={ref}
  player={player}
  controls
  pictureInPicture
  onFullscreenChange={(full) => {}}
  onPictureInPictureChange={(pip) => {}}
/>
```

> Fullscreen and PiP **are** available in v7 — they live on the **view**: use the `VideoView` ref + view props/events (above).
