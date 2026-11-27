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

## Subtitle styling

Styling the *rendering* of the currently selected text track is a `VideoView` prop, separate from track selection above - native on both Android and iOS:

```tsx
<VideoView
  player={player}
  subtitleStyle={{
    fontScale: 1.5,               // both platforms
    foregroundColor: '#FFFF00',   // both platforms - '#RRGGBB' or '#AARRGGBB' (alpha first)
    backgroundColor: '#C0000000', // both platforms
    edgeType: 'outline',          // both platforms - 'none' | 'outline' | 'dropShadow' | 'raised' | 'depressed'
    windowColor: '#80333333',     // Android only
    edgeColor: '#FF000000',       // Android only
    bottomPadding: 0.08,          // both platforms - DIFFERENT semantics, see below
  }}
/>
```

All fields are optional; anything unset falls back to the platform default. `windowColor`/`edgeColor` have no iOS equivalent (Core Media's `CMTextMarkupAttribute` keys only expose the edge *style*, not a separate color for it), so those two are Android-only - see `docs/docs/player/subtitle-styling.md`.

`bottomPadding` is **not** equivalent across platforms. Android is purely additive - implemented as real view padding on `SubtitleView`'s internal rendering child, *not* `SubtitleView.setBottomPaddingFraction()` (that native API only applies to a cue with a completely unset `line`; real WebVTT/SRT cues carry an explicit default like WebVTT's implicit "last line" `line=-1`, which silently bypasses it - confirmed by decompiling `SubtitlePainter`/`CanvasSubtitleOutput`, not by assumption). iOS has no additive-padding primitive, so it's implemented as an absolute vertical position override (`kCMTextMarkupAttribute_OrthogonalLinePositionPercentageRelativeToWritingDirection`) that replaces the system's placement outright, including multi-line/dual-subtitle collision avoidance. Leave it unset on iOS unless the position genuinely needs to be pinned (nothing is applied on iOS when unset; Android defaults to `0.08`). On iOS a style change redraws the on-screen cue immediately only while paused; during playback it applies from the next cue.

**iOS live-update gotcha, found and fixed by live testing, not assumption**: assigning a new `AVTextStyleRule` to `AVPlayerItem.textStyleRules` is a no-op for a cue that's already being displayed (confirmed: changing it while paused mid-cue produced zero visible change) - AVFoundation only re-evaluates it on the next cue transition. `VideoComponentView.applySubtitleStyle()` forces an immediate redraw itself: it re-asserts the current legible media selection for tracks that expose one (deselect then reselect the same `AVMediaSelectionOption`), or toggles the player item track's `isEnabled` off/on for ones that don't (e.g. an external VTT subtitle on a plain MP4, which is added as an always-on composition track with no selection group at all, not a selectable legible option). Both are invisible to the viewer - no seek, no playback interruption.

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
