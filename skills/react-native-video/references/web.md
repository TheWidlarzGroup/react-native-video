# Web (browser) support

react-native-video **v7** supports the **web** platform via **video.js v10** — the **same** `useVideoPlayer` + `VideoView` API as native (through react-native-web). No extra CSS or config beyond a standard RN-Web setup.

```tsx
import { useVideoPlayer, VideoView } from 'react-native-video';

function Player() {
  const player = useVideoPlayer({ uri: 'https://example.com/video.mp4' });
  return <VideoView player={player} controls style={{ width: '100%', aspectRatio: 16 / 9 }} />;
}
```

- Sources must be **URL strings** — `require('./video.mp4')` is not supported on web.
- Audio-only works the same way (create the player, no `VideoView`).

## Supported on web
Play/pause/seek, volume/mute, loop, playback rate, **text tracks** (incl. external subtitles), `resizeMode`, **fullscreen**, **Picture-in-Picture** (browser-dependent), **Media Session** (lock-screen controls), `preload`, core playback events, **HLS** (via video.js).

## Web-only extras — `WebVideoPlayer`
Audio/video **track selection** is web-only and experimental (~Safari only; empty arrays elsewhere). Cast the player for typed access:

```tsx
import { useVideoPlayer, type WebVideoPlayer } from 'react-native-video';

const player = useVideoPlayer(source) as WebVideoPlayer;
player.getAvailableAudioTracks(); player.selectAudioTrack(track);
player.getAvailableVideoTracks(); player.selectVideoTrack(track);
```

The plain `useVideoPlayer` works fine on web; the cast just exposes these extras.

> Web support evolves — for the **current** matrix of what is and isn't supported on web yet, check the official web-support docs: https://docs.thewidlarzgroup.com/react-native-video/docs/v7/fundamentals/web-support
