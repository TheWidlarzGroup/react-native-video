---
title: Video Quality — Rendition/Track Selection
sidebar_position: 6
sidebar_label: Video Quality
description: Let viewers pin a specific video rendition (quality level), or go back to automatic adaptive selection, in React Native Video on Android and iOS.
keywords: [video quality, rendition selection, track selection, adaptive bitrate, ABR, HLS, react native video]
---

# Video Quality

React Native Video can enumerate the video renditions (quality levels) available for an HLS source and let viewers pin one, or leave it on automatic adaptive selection. The two platforms enforce a pin differently, and the API surfaces that honestly rather than pretending they behave the same.

### When do you need it?

If you want to offer a YouTube-style "Quality" menu (Auto / 1080p / 720p / …), or need to hard-cap playback to a specific rendition for a data-conscious mode, this is the built-in way to do it.

## Quick start

```tsx
import { useVideoPlayer, useEvent, VideoView } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer('https://example.com/master.m3u8');

  useEvent(player, 'onVideoTrackChange', (data) => {
    console.log('Available:', data.availableTracks);
    console.log('Selected:', data.selectedTrackId, 'Active:', data.activeTrackId);
  });

  return (
    <VideoView
      player={player}
      onPress={() => {
        const tracks = player.getAvailableVideoTracks();
        const rung720p = tracks.find((t) => t.height === 720);
        if (rung720p) player.selectVideoTrack(rung720p.id);
      }}
    />
  );
}
```

## API

- **`getAvailableVideoTracks(): VideoTrack[]`** — all video renditions for the current source, best first. Empty until the source's manifest has loaded — subscribe to `onVideoTrackChange` to know when this becomes populated (or changes, e.g. after a source replacement). Non-HLS (progressive) sources have nothing to choose from and always report an empty list.
- **`selectVideoTrack(trackId?: string): void`** — pin playback to a specific rendition, or call with no argument (`undefined`) for automatic (adaptive) selection. Safe to call before the source has loaded; the selection is latched and applied once renditions are known.
- **`selectedVideoTrackId: string | undefined`** (read-only) — the id passed to the last `selectVideoTrack` call, or `undefined` when automatic selection is active. This is the *request*, not necessarily what's rendering — see `activeTrackId` below.

```ts
interface VideoTrack {
  id: string;
  label: string; // e.g. "1080p", or "640p - 1.2 Mbps" when another rendition shares the resolution
  language?: string;
  selected: boolean;
  width?: number;   // frame width in pixels, as declared by the manifest/container
  height?: number;  // frame height in pixels, as declared by the manifest/container
  bitrate?: number; // peak bitrate in bits per second
}
```

:::info Android locks, iOS caps
**Android** enforces a pin as a **hard track-selection override** — the chosen rendition plays, full stop, with no fallback. A rendition the device can't decode is excluded from `getAvailableVideoTracks()` entirely, since an override has no adaptive fallback to fall back to.

**iOS** has no rendition-selection API in AVFoundation at all. A pin is enforced as a **resolution/peak-bitrate cap** on the player item: the chosen rendition becomes the *highest eligible* one, but `AVPlayerItem` may still adapt downwards under bandwidth pressure, and — critically — **will not climb back up** once it has dropped, even after you raise the cap again. Use `onVideoTrackChange`'s `activeTrackId` to see what's actually playing, which can differ from `selectedVideoTrackId` on iOS.
:::

## Events

Subscribe with [`useEvent`](./events.md#using-the-useevent-hook):

```tsx
useEvent(player, 'onVideoTrackChange', (data) => {
  console.log(data.availableTracks, data.selectedTrackId, data.activeTrackId);
});
```

| Event | Callback Signature | Description |
|---|---|---|
| `onVideoTrackChange` | `(data: VideoTrackChangeData) => void` | Fired when the set of available renditions changes (e.g. once the manifest has loaded), when the selected rendition changes, or — iOS only, since selection there is a cap rather than a hard lock — when the actually-playing rendition changes under adaptive bitrate. |

```ts
interface VideoTrackChangeData {
  availableTracks: VideoTrack[];
  selectedTrackId?: string; // what was requested (undefined = automatic)
  activeTrackId?: string;   // what's actually rendering (meaningful even under automatic selection)
}
```

On Android, `activeTrackId` always matches `selectedTrackId` (a hard lock has no daylight between the two). On iOS they can genuinely differ.

## Platform notes

### Android

Built on Media3's `TrackSelectionOverride`. Ids are positional (`"video-$groupIndex-$trackIndex"`), not `Format.id`, since that's neither stable nor meaningful across the content pipelines this ships against. Labels use the rendition's short edge, so portrait content correctly reads "1080p" rather than "1920p"; a " - N.N Mbps" suffix is added only where more than one rung shares a resolution.

Returning to Auto clears the override but deliberately never calls `setTrackTypeDisabled` — quality selection only ever swaps which rendition plays, never disables video.

### iOS

The rendition ladder is parsed directly from the HLS master playlist's `#EXT-X-STREAM-INF` entries, since AVFoundation exposes no rendition-enumeration API of its own. The chosen cap is deliberately *not* the rendition's own bitrate — it's the midpoint to the next-higher rendition (with headroom for the top rung) — since AVFoundation doesn't document whether its comparison is `<` or `<=`, and an exact cap can't separate same-resolution/different-bitrate rendition pairs that real ladders contain.

Caps are written twice (zeroed, then re-written a runloop turn later) because a single write isn't reliably honored, and are re-armed once more ~4s after a pin in case AVFoundation hasn't moved yet — after that, `activeTrackId` is left to report the truth rather than fighting AVFoundation further.

## Troubleshooting

- **Raised the cap on iOS but playback stays on the low rendition**: this is a real AVFoundation limitation, not a bug here — once it drops, it won't climb back up on its own. The reliable pattern for an app that needs an exact rung is to let the pin ride the *next* source/item rather than expecting a live upgrade.
- **Pinned a rendition on iOS and it briefly undershoots past the target**: also expected — AVFoundation's post-switch throughput estimate is pessimistic immediately after a cap change. It settles within a couple of seconds.
- **A rendition is missing from `getAvailableVideoTracks()` on Android**: check whether the device can decode it. Unsupported renditions are excluded rather than offered and then hard-locking playback to a black screen on selection.
- **`getAvailableVideoTracks()` returns an empty array**: either the manifest hasn't loaded yet (wait for the first `onVideoTrackChange`), or the source is progressive (non-HLS) and genuinely has only one rendition.
