---
sidebar_position: 4
sidebar_label: track selection
description: How to select specific tracks for download
---

# Track Selection

Track selection allows you to download only the specific audio, video, and subtitle tracks you need, optimizing storage usage and download time.

## Why Select Tracks?

- **Storage Optimization**: Download only the tracks you need (e.g., specific language, resolution)
- **Language Support**: Choose audio tracks in different languages
- **Subtitle Selection**: Download only the subtitle languages your users need
- **Bitrate Control**: Select video tracks with appropriate bitrates for your use case

## How It Works

The track selection process follows a 2-step flow:

1. **Inspect Available Tracks**: Use `getAvailableTracks(url)` to retrieve all available tracks
2. **Select Tracks for Download**: Pass the selected track IDs to `downloadStream` in the `tracks` property

### Step 1: Get Available Tracks

Use `getAvailableTracks` to retrieve all available tracks. See [getAvailableTracks](./downloading.md#getavailabletracks) in API Reference for complete details.

```tsx
import { getAvailableTracks } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const tracks = await getAvailableTracks("https://example.com/video.m3u8");
// tracks.video, tracks.audio, tracks.text contain available tracks
```

### Step 2: Download Selected Tracks

```tsx
import { downloadStream } from "@TheWidlarzGroup/react-native-video-stream-downloader";

// Select specific tracks
const selectedTracks = [
  tracks.video[0].id, // First video track (usually highest quality)
  tracks.audio.find(t => t.language === "en")?.id, // English audio
  tracks.text.find(t => t.language === "en")?.id, // English subtitles
].filter(Boolean); // Remove undefined values

await downloadStream("https://example.com/video.m3u8", {
  tracks: selectedTracks.map(id => ({ id, type: "video" })), // You need to specify type
});
```

## Example: Multi-Language Selection

```tsx
import { getAvailableTracks, downloadStream } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const tracks = await getAvailableTracks(videoUrl);

// Select video track (highest quality)
const videoTrack = tracks.video[0];

// Select multiple audio tracks (English and Spanish)
const audioTracks = tracks.audio.filter(t => 
  t.language === "en" || t.language === "es"
);

// Select subtitles for both languages
const subtitleTracks = tracks.text.filter(t => 
  t.language === "en" || t.language === "es"
);

// Build track selection array
const selectedTracks = [
  { id: videoTrack.id, type: "video" as const },
  ...audioTracks.map(t => ({ id: t.id, type: "audio" as const })),
  ...subtitleTracks.map(t => ({ id: t.id, type: "text" as const })),
];

await downloadStream(videoUrl, {
  tracks: selectedTracks,
});
```

## Default Behavior

If you don't specify `tracks` in `downloadStream`, or if `includeAllTracks` is `false`, only the default tracks are downloaded (typically the first video track and the first audio track).

To download all available tracks, set `includeAllTracks: true`:

```tsx
await downloadStream(videoUrl, {
  includeAllTracks: true,
});
```
