---
title: Audio Tracks — Alternate Language & Commentary Selection
sidebar_position: 6
sidebar_label: Audio Tracks
description: Enumerate and select alternate audio tracks (dubs, commentary, described video) in React Native Video on Android and iOS.
keywords: [audio tracks, alternate audio, dub, commentary, described video, multi-language, react native video]
---

# Audio Tracks

React Native Video can enumerate and select alternate audio tracks for a source — different languages, a commentary track, or a described-video mix. Audio selection is a real, exact switch on both platforms, not an approximation: there's no separate "requested vs. actually playing" split, because the selection *is* what plays.

### When do you need it?

If your content ships multiple audio renditions (dubs, commentary tracks, audio description) and you want to let viewers pick one — or show what's currently selected — this is the built-in way to do it, without reaching for platform-specific APIs yourself.

## Quick start

```tsx
import { useVideoPlayer, useEvent, VideoView } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer('https://example.com/video.m3u8');

  useEvent(player, 'onAudioTrackChange', (data) => {
    console.log('Available:', data.availableTracks);
    console.log('Selected:', data.selectedTrackId);
  });

  return (
    <VideoView
      player={player}
      onPress={() => {
        const tracks = player.getAvailableAudioTracks();
        const spanish = tracks.find((t) => t.language === 'es');
        if (spanish) player.selectAudioTrack(spanish.id);
      }}
    />
  );
}
```

## API

- **`getAvailableAudioTracks(): AudioTrack[]`** — all alternate audio tracks for the current source. Empty until the source's manifest/asset has loaded — subscribe to `onAudioTrackChange` to know when this becomes populated.
- **`selectAudioTrack(trackId?: string): void`** — select a track by id, or call with no argument (`undefined`) to go back to the default track. Safe to call before the source has loaded; the selection is latched and applied once tracks are known.
- **`selectedAudioTrackId: string | undefined`** (read-only) — the id of the currently selected track, or `undefined` while the default track is active.

```ts
interface AudioTrack {
  id: string;
  label: string;
  language?: string;
  selected: boolean;
  channels?: number; // e.g. 2 for stereo, 6 for 5.1 surround — only known for the track actually playing
}
```

:::info
Calling `selectAudioTrack()` with no argument is **not** the same as "no audio" — there's no way to mute just the audio track selection itself (use the player's `muted` property for that). It means "let the platform pick the default" (system language, or the source's default rendition).
:::

## Events

Subscribe with [`useEvent`](./events.md#using-the-useevent-hook):

```tsx
useEvent(player, 'onAudioTrackChange', (data) => {
  console.log(data.availableTracks, data.selectedTrackId);
});
```

| Event | Callback Signature | Description |
|---|---|---|
| `onAudioTrackChange` | `(data: AudioTrackChangeData) => void` | Fired when the set of available audio tracks changes (e.g. once the source's manifest has loaded) or when the selected track changes. |

`AudioTrackChangeData`: `{ availableTracks: AudioTrack[], selectedTrackId?: string }`

## Platform notes

### Android

Built on Media3's `TrackSelectionOverride` — the same mechanism used for text tracks. Ids prefer the manifest-declared rendition identity (`Format.id` — the HLS `EXT-X-MEDIA` or DASH `AdaptationSet` entry), falling back to a positional id (`audio-$group-$track`) only where `Format.id` is absent or not distinct across all tracks.

Tracks the device can't decode are filtered out of `getAvailableAudioTracks()` entirely — forcing a selection onto an unsupported track would throw a native exception and kill playback outright, not just fail open the way an unsupported video rendition does.

### iOS

Built on `AVMediaSelectionGroup`/`AVPlayerItem.select(_:in:)` with the `.audible` media characteristic — the same construct text tracks already use, just a different characteristic. Ids are positional (`audio-$index-$displayName-$language`), since nothing on `AVMediaSelectionOption` is both stable and unique (two English options — stereo and 5.1, or original and described — can share a display name and language tag).

`channels` is only ever reported for the track actually being rendered — `AVMediaSelectionOption` carries no channel count of its own, so it's read from the loaded track's format description, and reporting that count against the *other* options would be a guess.

## Troubleshooting

- **`selected: false` on every track even though one should be active**: tracks haven't loaded yet. Wait for the first `onAudioTrackChange` before reading `getAvailableAudioTracks()`.
- **A pick made right after creating the player seems ignored**: it isn't — `selectAudioTrack()` latches the request and replays it once the source's tracks are known, which can be a moment after the call returns. Rely on `onAudioTrackChange`/`selectedAudioTrackId` rather than assuming the call is synchronous.
- **An Android rendition is missing from `getAvailableAudioTracks()`**: check whether the device can actually decode it. Undecodable renditions (e.g. a Dolby Atmos track on hardware without an E-AC-3 decoder) are deliberately excluded rather than offered and failing on selection.
