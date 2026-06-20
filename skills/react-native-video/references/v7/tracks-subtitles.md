# v7 — text tracks, subtitles, audio/video tracks

## Text tracks (subtitles/captions)

Selection is on the player:

```tsx
const tracks = player.getAvailableTextTracks(); // TextTrack[]
player.selectTextTrack(tracks[0]);              // or null to turn off
const current = player.selectedTrack;           // TextTrack | undefined
```

`TextTrack = { id, label, language?, selected }`.

React to changes via events (see `events.md`):
- `onTrackChange` → the selected text track changed (`TextTrack | null`).
- `onTextTrackDataChanged` → the currently displayed subtitle text (`string[]`).

## External (sidecar) subtitles

Pass them on the source config:

```tsx
useVideoPlayer({
  uri: 'https://example.com/master.m3u8',
  externalSubtitles: [
    { uri: 'https://example.com/en.vtt', label: 'English', language: 'en', type: 'vtt' },
  ],
});
```

> iOS supports only `.vtt` external subtitles. Embedded tracks (in the HLS/DASH manifest) work via `getAvailableTextTracks()` on both platforms.

## Audio / video track selection

- **Native (iOS/Android):** the core player exposes **text** track selection only; there are no audio/video-track selection methods on `VideoPlayer`.
- **Web only:** cast the player to `WebVideoPlayer` for `getAvailableAudioTracks()/selectAudioTrack()` and `getAvailableVideoTracks()/selectVideoTrack()` (experimental, limited browser support):

```tsx
import type { WebVideoPlayer } from 'react-native-video';
const web = player as WebVideoPlayer;
web.selectVideoTrack(web.getAvailableVideoTracks()[0]);
```

The `AudioTrack` / `VideoTrack` types are exported (`{ id, label, language?, selected }`) but native audio/video-track switching is not in the core player.
