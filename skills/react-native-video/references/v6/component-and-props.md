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
| `adTagUrl` | `string` | **VAST/IMA ad tag**. |
| `viewType` | `ViewType` (`'textureView'` / `'surfaceView'` / `'secureView'`) | Rendering surface (default `surfaceView`). |

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

> This is the common set. In v6, `bufferConfig` / `drm` / `adTagUrl` / `textTracks` are now preferred **inside `source`** (e.g. `source.drm`, `source.ad.adTagUrl`) — the top-level props still work but are deprecated. `fullscreen` works on **both** platforms. Full prop list: https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/props/

## Audio-only

react-native-video handles audio-only playback well. In v6, keep the `<Video>` component **mounted** (it must be, to play) but render it **hidden**:

```tsx
<Video
  source={{ uri: 'https://example.com/audio.m3u8' }}
  paused={false}
  playInBackground
  style={{ width: 0, height: 0 }}   // mounted but invisible
/>
```

It works fine, but it's clunkier than v7 — there audio-only is just the `useVideoPlayer` hook with **no view at all** (see `../v7/player-model.md`). For lock-screen controls add `showNotificationControls` — see `../shared/background-playback.md`.

> **v7 note:** none of these props exist the same way in v7 — there `source`/`drm`/`bufferConfig` move into the `useVideoPlayer` config and `paused`/`muted`/`rate` become player properties. See `../migration-v6-to-v7.md`.
