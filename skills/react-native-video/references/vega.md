# Vega OS (Fire TV) support

react-native-video **v7** runs on **Vega OS** (Amazon's React Native platform for newer Fire TV devices) through the platform player, `VideoPlayer` from `@amazon-devices/react-native-w3cmedia`. Same `useVideoPlayer` + `VideoView` API. Metro picks the package's `*.kepler.ts` files on Vega; Nitro is not used there.

```tsx
import { useVideoPlayer, VideoView } from 'react-native-video';

function Player() {
  const player = useVideoPlayer({ uri: 'https://example.com/video.mp4' }, (p) => {
    p.showNotificationControls = true; // the remote's play/pause and "Alexa, pause"
    p.play();
  });
  return <VideoView player={player} style={{ flex: 1 }} resizeMode="contain" />;
}
```

- `manifest.toml` must list the media services under `[wants]` (`com.amazon.media.server`, `com.amazon.media.playersession.service`, `com.amazon.mediabuffer.service`, …); without them the video stays black.
- Remote and voice play/pause also need the `com.amazon.category.kepler.media` category and the `IMediaPlaybackServer` interface provider in `manifest.toml`.
- Sources must be **URL strings** of files the platform opens by URL (for example MP4). No HLS/DASH, DRM or text tracks yet. Request `headers` work with w3cmedia versions that have `setSrcWithCustomHeaders`.
- `initialize()` / `preload()` resolve when the player has started, not when the video has loaded: wait for `onLoad`.
- The player a `VideoView` shows pauses when the app goes to the background, unless `playInBackground = true`.
- `onLoad` reports the size as `0x0` (w3cmedia does not give it in URL mode).
- Fullscreen and Picture-in-Picture do nothing on a TV; there are no built-in controls.

> For the current matrix, check the official docs: https://docs.thewidlarzgroup.com/react-native-video/docs/v7/fundamentals/vega-support
