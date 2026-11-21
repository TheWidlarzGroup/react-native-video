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

`bottomPadding` is **not** equivalent across platforms. Android is purely additive - implemented as real view padding on `SubtitleView`'s internal rendering child, *not* `SubtitleView.setBottomPaddingFraction()` (that native API only applies to a cue with a completely unset `line`; real WebVTT/SRT cues carry an explicit default like WebVTT's implicit "last line" `line=-1`, which silently bypasses it - confirmed by decompiling `SubtitlePainter`/`CanvasSubtitleOutput`, not by assumption). iOS has no additive-padding primitive, so it's implemented as an absolute vertical position override (`kCMTextMarkupAttribute_OrthogonalLinePositionPercentageRelativeToWritingDirection`) that replaces the system's placement outright, including multi-line/dual-subtitle collision avoidance. Leave it unset on iOS unless the position genuinely needs to be pinned.

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

## Audio / video track selection

Audio/video **track selection** is a **web** capability (experimental — Safari-leaning). On native, the player handles **text** track selection (above). Cast to `WebVideoPlayer` for `getAvailableAudioTracks()/selectAudioTrack()` and `getAvailableVideoTracks()/selectVideoTrack()`:

```tsx
import type { WebVideoPlayer } from 'react-native-video';
const web = player as WebVideoPlayer;
web.selectVideoTrack(web.getAvailableVideoTracks()[0]);
```

The `AudioTrack` / `VideoTrack` types (`{ id, label, language?, selected }`) are exported for use with these web APIs.
