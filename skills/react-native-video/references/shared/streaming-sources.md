# Sources & streaming: HLS / DASH / headers / buffering (v6 & v7)

The source concept is the same across versions; only *where* you put it differs.

- **v6:** `<Video source={{ uri, headers, type }} bufferConfig={...} maxBitRate={...} />`
- **v7:** `useVideoPlayer({ uri, headers, bufferConfig })` (config object or a URL string).

## Formats

- **HLS** (`.m3u8`), **DASH** (`.mpd`), and progressive **MP4/MOV** are supported (Android ExoPlayer/Media3; iOS AVPlayer; web video.js). SmoothStreaming is **v6-only**.
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

Android field names are shared across versions (`minBufferMs`, `maxBufferMs`, `bufferForPlaybackMs`, `bufferForPlaybackAfterRebufferMs`, `backBufferDurationMs`) but **defaults differ**: v7 → 5000 / 10000 / 1000 / 2000; v6 → any unset field falls back to **Media3 `DefaultLoadControl`** (50000 / 50000 / 1000 / 2000, backBuffer 0). The iOS buffer-config fields (`preferredForwardBufferDurationMs`, `preferredPeakBitRate`, `preferredMaximumResolution`) and the `livePlayback` block are **v7-only**; in v6 the iOS forward buffer is the top-level `preferredForwardBufferDuration` prop, and `maxBitRate` caps bandwidth.

For a feed, lower the Android min/max buffer so offscreen players don't over-buffer and eat memory.

## Caching vs offline (different things — don't confuse them)

- **Caching** = transparent; stops a clip you replay/loop from re-downloading. **v6 has it built in:** opt in with the `$RNVideoUseVideoCaching=true` Podfile flag (iOS; progressive **MP4/M4V/MOV only**, not HLS) and set `bufferConfig.cacheSizeMB` (Android, LRU). v7 also caches internally (less configurable). Reach for this when "the same remote clip re-downloads on every replay."
- **Offline / downloading** = persistent, user-initiated; **not in core**:
  - Plain MP4 → download it yourself and play the `file://` path. Expo: `expo-file-system`. RN CLI: prefer `react-native-blob-util` for the download itself — it streams straight to disk (no JS-memory/BASE64), with background downloads + progress, which suits large media; use `@dr.pogodin/react-native-fs` (the maintained, New-Architecture fork — not the old unmaintained `react-native-fs`) for general file-system work or as a drop-in if you already use `react-native-fs`.
  - HLS/DASH or DRM offline → TheWidlarzGroup **Offline SDK** (`../extensions.md`). There's no built-in `OfflineVideo`/download API.
