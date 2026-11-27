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

Real, exact selection on native (Android/iOS), not an approximation — the same mechanism as text tracks, just for alternate audio renditions (dubs, commentary, described video):

```tsx
const tracks = player.getAvailableAudioTracks(); // AudioTrack[]
player.selectAudioTrack(tracks[0].id);           // or call with no argument for the default track
const currentId = player.selectedAudioTrackId;   // the active track's id (the default track when none was picked); undefined only before tracks are known
```

`AudioTrack = { id, label, language?, selected, channels? }` — `channels` is only ever populated for the track actually being rendered.

React to changes via `onAudioTrackChange` → `{ availableTracks: AudioTrack[], selectedTrackId?: string }` (see `events.md`).

There's no separate "requested vs. actually playing" split: the selection *is* what plays on both platforms.

Track ids are only valid for the source they came from (on iOS they are positional): don't reuse an id an app saved earlier on a different source; re-resolve it from `getAvailableAudioTracks()` by `language`/`label`.
