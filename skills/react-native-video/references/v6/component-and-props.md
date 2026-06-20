# v6 — `<Video>` component & props

`import Video from 'react-native-video'` (default export). All configuration is via props on `<Video>`.

## Common props

| Prop | Type | Purpose |
|---|---|---|
| `source` | `{ uri, headers?, type? }` or `require(...)` | The media to play (required). |
| `paused` | `boolean` | Pause/resume (declarative play/pause). |
| `muted` | `boolean` | Mute audio. |
| `volume` | `number` | 0.0–1.0. |
| `rate` | `number` | Playback speed (1.0 = normal). |
| `repeat` | `boolean` | Loop on end. |
| `resizeMode` | `'none'\|'contain'\|'cover'\|'stretch'` | Scaling. |
| `controls` | `boolean` | Native controls. |
| `poster` | `object` | Image while loading (`renderLoader` for custom). |
| `fullscreen` | `boolean` | Enter fullscreen. |
| `fullscreenOrientation` | `string` | Restrict fullscreen orientation. |
| `bufferConfig` | `object` | Android buffer tuning (see `../shared/streaming-sources.md`). |
| `maxBitRate` | `number` | Cap bandwidth (bits/sec). |
| `preferredForwardBufferDuration` | `number` | iOS ahead-buffer (seconds). |
| `selectedAudioTrack` / `selectedTextTrack` / `selectedVideoTrack` | `object` | Track selection (see `tracks-subtitles.md`). |
| `drm` | `object` | DRM config (see `drm.md`). |
| `playInBackground` | `boolean` | Keep playing when backgrounded. |
| `playWhenInactive` | `boolean` | iOS: keep playing under notifications. |
| `ignoreSilentSwitch` | `'inherit'\|'ignore'\|'obey'` | iOS silent switch. |
| `mixWithOthers` | `'inherit'\|'mix'\|'duck'` | Audio mixing. |
| `showNotificationControls` | `boolean` | Lock-screen/notification controls. |
| `progressUpdateInterval` | `number` | ms between `onProgress` (default 250). |
| `reportBandwidth` | `boolean` | Enable `onBandwidthUpdate`. |
| `adTagUrl` | `string` | **VAST/IMA ad tag** (v6 has ads; v7 core does not). |
| `viewType` | `ViewType` enum | Rendering surface (`TEXTURE` / `SURFACE` / `SURFACE_SECURE`). |

## Minimal example

```tsx
<Video
  source={{ uri: 'https://example.com/master.m3u8' }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  controls
  paused={paused}
  resizeMode="contain"
  onLoad={({ duration }) => {}}
  onProgress={({ currentTime }) => {}}
  onError={(e) => {}}
/>
```

> This is the common set. In v6, `bufferConfig` / `drm` / `adTagUrl` / `textTracks` are now preferred **inside `source`** (e.g. `source.drm`) — the top-level props still work but are deprecated; `fullscreen` / `fullscreenOrientation` are iOS-only. Full prop list: https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/props/

> **v7 note:** none of these props exist the same way in v7 — there `source`/`drm`/`bufferConfig` move into the `useVideoPlayer` config and `paused`/`muted`/`rate` become player properties. See `../migration-v6-to-v7.md`.
