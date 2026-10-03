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

## Audio track selection

Real, exact selection on native (Android/iOS), not an approximation — the same mechanism as text tracks, just for alternate audio renditions (dubs, commentary, described video):

```tsx
const tracks = player.getAvailableAudioTracks(); // AudioTrack[]
player.selectAudioTrack(tracks[0].id);           // or call with no argument for the default track
const currentId = player.selectedAudioTrackId;   // string | undefined
```

`AudioTrack = { id, label, language?, selected, channels? }` — `channels` is only ever populated for the track actually being rendered.

React to changes via `onAudioTrackChange` → `{ availableTracks: AudioTrack[], selectedTrackId?: string }` (see `events.md`).

Unlike video quality (below), there's no separate "requested vs. actually playing" split: the selection *is* what plays on both platforms.

## Video track (quality) selection

Video **quality/track selection** is a **web** capability (experimental — Safari-leaning). On native, the player handles **text** and **audio** track selection (above), but not yet video quality/rendition selection. Cast to `WebVideoPlayer` for `getAvailableVideoTracks()/selectVideoTrack()` on web:

```tsx
import type { WebVideoPlayer } from 'react-native-video';
const web = player as WebVideoPlayer;
web.selectVideoTrack(web.getAvailableVideoTracks()[0]);
```

The `VideoTrack` type (`{ id, label, language?, selected }`) is exported for use with this web API.
