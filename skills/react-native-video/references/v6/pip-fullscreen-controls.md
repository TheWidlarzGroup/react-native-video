# v6 — Picture-in-Picture, fullscreen, controls

## Native controls

```tsx
<Video source={{ uri }} controls />
```

## Fullscreen

- Prop: `fullscreen={true}` (plus `fullscreenOrientation`, `fullscreenAutorotate`).
- Ref: `ref.current?.setFullScreen(true)` (preferred over the deprecated `presentFullscreenPlayer()`).
- Events: `onFullscreenPlayerWillPresent` / `DidPresent` / `WillDismiss` / `DidDismiss`.

## Picture-in-Picture

- Auto-enter when leaving the app: `enterPictureInPictureOnLeave={true}`.
- Ref: `enterPictureInPicture()` / `exitPictureInPicture()`.
- Event: `onPictureInPictureStatusChanged`.
- iOS: needs the audio background mode; Android: manifest `supportsPictureInPicture` + `minSdk 26`. See `../shared/platform-setup.md`.

```tsx
const ref = useRef<VideoRef>(null);
<Video ref={ref} source={{ uri }} controls enterPictureInPictureOnLeave
  onPictureInPictureStatusChanged={({ isActive }) => {}} />;
// ref.current?.enterPictureInPicture();
// ref.current?.setFullScreen(true);
```

> **PiP testing:** not supported on the **iOS Simulator** — test on a real iOS device. PiP *does* work on the **Android emulator** (API 26+, Google Play image).

> **v7 note:** these move to the `VideoView` ref (`enterFullscreen`/`enterPictureInPicture`) and view props/events (`onFullscreenChange`, `onPictureInPictureChange`). See `../v7/pip-fullscreen-controls.md`.
