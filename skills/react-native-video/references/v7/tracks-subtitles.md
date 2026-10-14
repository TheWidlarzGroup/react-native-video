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

## Video quality (track) selection

Real selection on native (Android/iOS) — pin a specific HLS rendition, or go back to automatic adaptive selection:

```tsx
const tracks = player.getAvailableVideoTracks(); // VideoTrack[]
player.selectVideoTrack(tracks[0].id);           // or call with no argument for automatic
const requestedId = player.selectedVideoTrackId; // what was requested
```

`VideoTrack = { id, label, language?, selected, width?, height?, bitrate? }`.

React to changes via `onVideoTrackChange` → `{ availableTracks, selectedTrackId?, activeTrackId? }` (see `events.md`).

**Platforms enforce a pin differently**: Android is a hard track-selection override (selected == active, always). iOS has no rendition-selection API, so a pin is enforced as a resolution/bitrate cap — the player may still adapt within or below the cap, and `activeTrackId` (not `selectedVideoTrackId`) is what reports the rendition actually rendering.

## Audio track selection

Audio **track selection** is a **web** capability (experimental — Safari-leaning). On native, the player handles **text** and **video quality** track selection (above), but not yet alternate audio tracks. Cast to `WebVideoPlayer` for `getAvailableAudioTracks()/selectAudioTrack()` on web:

```tsx
import type { WebVideoPlayer } from 'react-native-video';
const web = player as WebVideoPlayer;
web.selectAudioTrack(web.getAvailableAudioTracks()[0]);
```

The `AudioTrack` type (`{ id, label, language?, selected }`) is exported for use with this web API.
