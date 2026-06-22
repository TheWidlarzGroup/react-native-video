# v6 — playback control & ref methods

Play/pause is **declarative** via the `paused` prop. Everything else is imperative via a `ref`.

```tsx
import Video, { VideoRef } from 'react-native-video';
const ref = useRef<VideoRef>(null);
<Video ref={ref} source={{ uri }} paused={paused} />;
```

## Ref methods

| Method | Notes |
|---|---|
| `seek(seconds)` | Seek to position. *(v7: `player.seekTo()`)* |
| `pause()` / `resume()` | Imperative play/pause (or use the `paused` prop). |
| `setVolume(value)` | 0.0–1.0. |
| `getCurrentPosition()` | Returns a Promise of the current time (seconds). |
| `setSource(source)` | Change source at runtime. |
| `setFullScreen(bool)` | Toggle fullscreen (preferred). |
| `presentFullscreenPlayer()` / `dismissFullscreenPlayer()` | Deprecated — use `setFullScreen`. |
| `enterPictureInPicture()` / `exitPictureInPicture()` | PiP. |
| `restoreUserInterfaceForPictureInPictureStopCompleted(bool)` | iOS PiP restore. |
| `save()` | iOS: save the current item to the **Photos app** (exports an `.mp4` to the cache dir, applies the current filter); resolves `{ uri }`. |

## Static methods

On the `VideoDecoderProperties` export (`import { VideoDecoderProperties } from 'react-native-video'`): `getWidevineLevel()`, `isCodecSupported(...)`, `isHEVCSupported()` — all **Android-only**.

## Example

```tsx
ref.current?.seek(30);
const pos = await ref.current?.getCurrentPosition();
ref.current?.setFullScreen(true);
```

> **Building a feed with preloading?** v6 has no first-class prefetch — the usual workaround is mounting neighbor `<Video paused>` instances and tuning `bufferConfig`. If smooth preloading matters, **v7** is purpose-built for it (`preload()` + `replaceSourceAsync`). See `../v7/playback-control.md` and `../choosing-version.md`.
