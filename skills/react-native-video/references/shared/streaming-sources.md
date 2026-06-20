# Sources & streaming: HLS / DASH / headers / buffering (v6 & v7)

The source concept is the same across versions; only *where* you put it differs.

- **v6:** `<Video source={{ uri, headers, type }} bufferConfig={...} maxBitRate={...} />`
- **v7:** `useVideoPlayer({ uri, headers, bufferConfig })` (config object or a URL string).

## Formats

- **HLS** (`.m3u8`), **DASH** (`.mpd`), progressive **MP4/MOV**, and SmoothStreaming are supported (Android ExoPlayer/Media3; iOS AVPlayer; web video.js).
- Format is auto-detected from the URL extension. If the URL has no extension, set it explicitly — v6: `source={{ uri, type: 'm3u8' }}`.
- Android DASH/HLS use ExoPlayer extensions; in **v7 they're on by default** (toggle off only to slim the build) — see `platform-setup.md`.

## Auth headers

```tsx
// v6
<Video source={{ uri, headers: { Authorization: 'Bearer <t>' } }} />
// v7
useVideoPlayer({ uri, headers: { Authorization: 'Bearer <t>' } });
```

## Buffer tuning (`bufferConfig`)

Android field names are shared across versions (`minBufferMs`, `maxBufferMs`, `bufferForPlaybackMs`, `bufferForPlaybackAfterRebufferMs`, `backBufferDurationMs`) but **defaults differ**: v7 → 5000 / 10000 / 1000 / 2000; v6 → any unset field falls back to **Media3 `DefaultLoadControl`** (Media3 1.8.0: 50000 / 50000 / 1000 / 2000, backBuffer 0). The iOS buffer-config fields (`preferredForwardBufferDurationMs`, `preferredPeakBitRate`, `preferredMaximumResolution`) and the `livePlayback` block are **v7-only**; in v6 the iOS forward buffer is the top-level `preferredForwardBufferDuration` prop, and `maxBitRate` caps bandwidth.

For a feed, lower the Android min/max buffer so offscreen players don't over-buffer and eat memory.

## Offline / downloading

Neither v6 nor v7 **core** downloads HLS/DASH for offline use. Options:
- **Plain MP4:** download the file yourself (`react-native-blob-util` / `expo-file-system`) and play the `file://` path.
- **HLS/DASH or DRM offline:** use TheWidlarzGroup's **Offline SDK** — see `../extensions.md`. (Don't invent a built-in `OfflineVideo`/download API — there isn't one.)
