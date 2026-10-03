---
title: Subtitle Styling — Customize Caption Appearance
sidebar_position: 6
sidebar_label: Subtitle Styling
description: Customize the font size, color, background, and edge style of subtitles/captions on both Android and iOS in React Native Video.
keywords: [subtitle style, caption style, closed captions, text tracks, font size, react native video]
---

# Subtitle Styling

The `subtitleStyle` prop on `VideoView` customizes how the **currently selected** text track is rendered - font size, text color, background, and edge/outline style - independent of whichever track is active (see the player's `getAvailableTextTracks()` / `selectTextTrack()` for choosing *which* track plays).

```tsx
import { VideoView, useVideoPlayer } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer({ uri: 'https://example.com/video.m3u8' });

  return (
    <VideoView
      player={player}
      subtitleStyle={{
        fontScale: 1.5,
        foregroundColor: '#FFFF00',
        backgroundColor: '#C0000000',
        edgeType: 'outline',
      }}
    />
  );
}
```

## `SubtitleStyle`

All fields are optional - anything left unset falls back to the platform's own default captioning style.

| Field             | Type               | Platforms      | Description                                                                 |
| ----------------- | ------------------ | -------------- | ----------------------------------------------------------------------------- |
| `fontScale`       | `number`           | Android, iOS   | Scales the default subtitle font size. `1.0` is the default size, `1.5` is 50% larger. |
| `foregroundColor` | `string`           | Android, iOS   | Color of the subtitle text. `#RRGGBB` or `#AARRGGBB` (alpha-first, 8-digit hex). |
| `backgroundColor` | `string`           | Android, iOS   | Color of the box drawn directly behind the text. Same format as `foregroundColor`. |
| `edgeType`        | `SubtitleEdgeType` | Android, iOS   | `'none' \| 'outline' \| 'dropShadow' \| 'raised' \| 'depressed'`. Defaults to `'none'`. |
| `windowColor`     | `string`           | Android only   | Color of the padded caption window surrounding the background box.            |
| `edgeColor`       | `string`           | Android only   | Color of the edge/outline drawn around each character, when `edgeType` isn't `'none'`. |
| `bottomPadding`   | `number`           | Android, iOS (different semantics - see below) | Extra space to keep clear beneath the subtitle, as a fraction of the video's height. `0.08` keeps the bottom 8% of the frame clear. Defaults to `0.08` on Android. |

### Platform notes

- **Android** uses Media3's `SubtitleView`/`CaptionStyleCompat`. `fontScale` maps onto `SubtitleView`'s fractional text size; `edgeType`/`edgeColor`/`windowColor` map directly onto `CaptionStyleCompat`'s native edge-style and window-color fields; `bottomPadding` is applied as real view padding on `SubtitleView`'s internal rendering child (not `SubtitleView.setBottomPaddingFraction()` - see below for why).
- **iOS** applies an `AVTextStyleRule` to the active `AVPlayerItem` via Core Media's `CMTextMarkupAttribute` keys. `windowColor` and `edgeColor` have no equivalent key on iOS - Core Media only exposes the edge *style*, not a separate color for it - so those two fields are Android-only.
- Colors are parsed the same way on both platforms: `#RRGGBB`, or `#AARRGGBB` with the alpha channel first (matching Android's `Color.parseColor`), not the `#RRGGBBAA` (alpha-last) convention some CSS tooling uses.
- The style re-applies automatically whenever the source changes (a `replaceSourceAsync` call, or an ad break ending) - you don't need to re-set `subtitleStyle` after swapping sources.
- **iOS live updates**: AVFoundation only redraws a legible cue's appearance when its selection changes or a new cue starts - assigning a new `AVTextStyleRule` alone has no visible effect on a cue that's *already* on screen (including a paused frame), it only takes effect from the next cue transition onward. To make a live `subtitleStyle` change show up immediately, the native layer forces a redraw itself: it re-asserts the current legible media selection for tracks that have one (HLS/native text tracks), or toggles the player item track's `isEnabled` for ones that don't (e.g. an external subtitle on a plain MP4, which AVFoundation adds as an always-on composition track rather than a selectable option). This is handled automatically - no action needed when using `subtitleStyle`.

### `bottomPadding` behaves differently per platform

There is no additive-padding primitive on iOS, so `bottomPadding` is implemented differently on each platform and the two aren't quite equivalent:

- **Android**: purely additive, applied as real view padding on `SubtitleView`'s internal rendering child. `SubtitleView.setBottomPaddingFraction()` looks like the obvious native API for this, but it's a trap: it's only honored for a cue whose own `line` is completely unset, and real-world WebVTT/SRT cues (including a plain cue with no `line:` setting at all) carry an explicit default line (e.g. WebVTT's implicit "last line", `line=-1`), which bypasses it entirely and renders flush to the bottom regardless of the value passed in. Applying it as padding on the view that actually lays out and draws cues shrinks the bounding box every cue positions itself within instead, so it affects placement uniformly no matter how a cue sets its own line.
- **iOS**: `bottomPadding` instead pins the cue's absolute vertical line position (`kCMTextMarkupAttribute_OrthogonalLinePositionPercentageRelativeToWritingDirection`), overriding the system's own placement outright - including its multi-line and dual-subtitle collision avoidance. `0` positions the cue at the very bottom edge; `1` positions it at the very top. If you don't need the position pinned, prefer leaving this field unset on iOS so the system keeps control of placement.

## Troubleshooting

- **Style doesn't appear to change anything** - subtitles are only rendered while a text track is actually selected. Confirm `player.selectedTrack` is non-`undefined` first; `subtitleStyle` only affects *how* the active track looks, not whether one is playing.
- **`windowColor`/`edgeColor` have no effect on iOS** - expected; see the platform notes above.
- **Colors look wrong** - double-check you're using alpha-first (`#AARRGGBB`), not alpha-last. A plain 6-digit `#RRGGBB` is always treated as fully opaque on both platforms.
- **`bottomPadding` moved the subtitle further than expected on iOS, or it stopped avoiding overlapping with a second subtitle track** - expected; iOS implements this as an absolute position override, not additive padding. See "`bottomPadding` behaves differently per platform" above.
