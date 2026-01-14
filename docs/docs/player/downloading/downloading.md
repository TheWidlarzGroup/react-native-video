---
sidebar_position: 2
sidebar_label: downloading
description: Complete API reference for Offline Video SDK
---

# Downloading

## Authorization

### `registerPlugin(apiKey: string): Promise<boolean>`

Registers and authorizes the plugin with the provided API key. Must be called before using any other functions.

**Parameters:**
- `apiKey`: Your API key obtained from [sdk.thewidlarzgroup.com](https://sdk.thewidlarzgroup.com) or by contacting TheWidlarzGroup at [hi@thewidlarzgroup.com](mailto:hi@thewidlarzgroup.com)

**Returns:** `Promise<boolean>` - `true` if registration was successful, `false` otherwise

```tsx
import { registerPlugin } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const success = await registerPlugin("YOUR_API_KEY");
```

### `disablePlugin(): void`

Disables the plugin. After calling this, you'll need to call `registerPlugin` again to use the SDK.

```tsx
import { disablePlugin } from "@TheWidlarzGroup/react-native-video-stream-downloader";

disablePlugin();
```

### `isRegistered(): boolean`

Checks if the plugin is currently registered and authorized.

**Returns:** `boolean` - `true` if registered, `false` otherwise

```tsx
import { isRegistered } from "@TheWidlarzGroup/react-native-video-stream-downloader";

if (isRegistered()) {
  // Plugin is ready to use
}
```

## Configuration

### `setConfig(config: DownloadConfig): void`

Sets global configuration for downloads.

**Parameters:**
- `config`: Configuration with the following properties:
  - `updateFrequencyMS?: number` - How often to update download progress (in milliseconds)
  - `maxParallelDownloads?: number` - Maximum number of simultaneous downloads

```tsx
import { setConfig } from "@TheWidlarzGroup/react-native-video-stream-downloader";

setConfig({
  updateFrequencyMS: 1000,
  maxParallelDownloads: 3,
});
```

### `getConfig(): DownloadConfig`

Gets the current global configuration.

**Returns:** `DownloadConfig` with properties:
- `updateFrequencyMS?: number`
- `maxParallelDownloads?: number`

```tsx
import { getConfig } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const config = getConfig();
```

## Download Management

### `downloadStream(url: string, options?: DownloadOptions): Promise<DownloadStatus>` {#downloadstream}

Downloads a video stream for offline playback.

**Parameters:**
- `url`: The URL of the video stream to download
- `options`: Optional download configuration with the following properties:
  - `includeAllTracks?: boolean` - Whether to download all available tracks (default: `false`)
  - `tracks?: Track[]` - Array of specific tracks to download. Each track has:
    - `id: string` - Track identifier
    - `type: 'video' | 'audio' | 'text'` - Track type
    - `language?: string` - Language code (for audio/text tracks)
  - `expiresAt?: number` - Unix timestamp when the download should expire
  - `drm?: DRMConfig` - DRM configuration (see [DRM Downloading](./drm-downloading.md) for details)
  - `metadata?: Record<string, string>` - Custom metadata to store with the download

**Returns:** `Promise<DownloadStatus>` - Status immediately after adding to queue (not after completion)

**DownloadStatus properties:**
- `id: string` - Unique download identifier
- `url: string` - Source URL
- `status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'` - Current status
- `progress: number` - Download progress (0-1)
- `bytesDownloaded: number` - Number of bytes downloaded
- `totalBytes: number` - Total bytes to download (may be `undefined` until known)

```tsx
import { downloadStream } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const status = await downloadStream("https://example.com/video.m3u8", {
  tracks: [
    { id: "video-1", type: "video" },
    { id: "audio-en", type: "audio", language: "en" },
  ],
});
```

### `pauseDownload(id: string): Promise<void>`

Pauses an active download.

**Parameters:**
- `id`: The download identifier returned from `downloadStream`

```tsx
import { pauseDownload } from "@TheWidlarzGroup/react-native-video-stream-downloader";

await pauseDownload(downloadId);
```

### `resumeDownload(id: string): Promise<void>`

Resumes a paused download.

**Parameters:**
- `id`: The download identifier returned from `downloadStream`

```tsx
import { resumeDownload } from "@TheWidlarzGroup/react-native-video-stream-downloader";

await resumeDownload(downloadId);
```

### `cancelDownload(id: string): Promise<void>`

Cancels a download and removes it from the queue. Also deletes any partially downloaded files.

**Parameters:**
- `id`: The download identifier returned from `downloadStream`

```tsx
import { cancelDownload } from "@TheWidlarzGroup/react-native-video-stream-downloader";

await cancelDownload(downloadId);
```

### `cancelAllDownloads(): Promise<void>`

Cancels all active and queued downloads.

```tsx
import { cancelAllDownloads } from "@TheWidlarzGroup/react-native-video-stream-downloader";

await cancelAllDownloads();
```

### `getDownloadStatus(id: string): Promise<DownloadStatus | null>`

Gets the current status of a specific download.

**Parameters:**
- `id`: The download identifier

**Returns:** `Promise<DownloadStatus | null>` - Current download status or `null` if not found

```tsx
import { getDownloadStatus } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const status = await getDownloadStatus(downloadId);
```

### `getDownloadsStatus(): Promise<DownloadStatus[]>`

Gets the status of all downloads (active, queued, completed, etc.).

**Returns:** `Promise<DownloadStatus[]>` - Array of all download statuses

```tsx
import { getDownloadsStatus } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const allStatuses = await getDownloadsStatus();
```

## Track Inspection

### `getAvailableTracks(url: string): Promise<AvailableTracks>` {#getavailabletracks}

Retrieves information about available audio, video, and subtitle tracks in a stream.

**Parameters:**
- `url`: The URL of the video stream to inspect

**Returns:** `Promise<AvailableTracks>` with the following structure:
- `video: VideoTrack[]` - Available video tracks, each with:
  - `id: string` - Track identifier
  - `width: number` - Video width in pixels
  - `height: number` - Video height in pixels
  - `bitrate: number` - Bitrate in bits per second
- `audio: AudioTrack[]` - Available audio tracks, each with:
  - `id: string` - Track identifier
  - `language: string` - Language code (e.g., "en", "es")
  - `bitrate: number` - Bitrate in bits per second
- `text: TextTrack[]` - Available subtitle tracks, each with:
  - `id: string` - Track identifier
  - `language: string` - Language code
  - `type: string` - Subtitle format (e.g., "text/vtt")

```tsx
import { getAvailableTracks } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const tracks = await getAvailableTracks("https://example.com/video.m3u8");

// Use tracks.video, tracks.audio, tracks.text to let user select
// Then pass selected tracks to downloadStream
```

For more details on track selection, see [Track Selection](./track-selection.md).

## Types

### `DownloadStatus` {#downloadstatus}

Status information for a download.

**Properties:**
- `id: string` - Unique download identifier
- `url: string` - Source URL
- `status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'` - Current status
- `progress: number` - Download progress (0-1)
- `bytesDownloaded: number` - Number of bytes downloaded
- `totalBytes: number | undefined` - Total bytes to download (may be `undefined` until known)

### `DownloadOptions`

Configuration options for `downloadStream`.

**Properties:**
- `includeAllTracks?: boolean` - Whether to download all available tracks (default: `false`)
- `tracks?: Track[]` - Array of specific tracks to download
- `expiresAt?: number` - Unix timestamp when the download should expire
- `drm?: DRMConfig` - DRM configuration (see [DRM Downloading](./drm-downloading.md))
- `metadata?: Record<string, string>` - Custom metadata to store with the download

### `Track`

A track selection for download.

**Properties:**
- `id: string` - Track identifier
- `type: 'video' | 'audio' | 'text'` - Track type
- `language?: string` - Language code (for audio/text tracks)

### `AvailableTracks`

Result from `getAvailableTracks` containing available tracks.

**Properties:**
- `video: VideoTrack[]` - Available video tracks
- `audio: AudioTrack[]` - Available audio tracks
- `text: TextTrack[]` - Available subtitle tracks

### `VideoTrack`

Information about a video track.

**Properties:**
- `id: string` - Track identifier
- `width: number` - Video width in pixels
- `height: number` - Video height in pixels
- `bitrate: number` - Bitrate in bits per second

### `AudioTrack`

Information about an audio track.

**Properties:**
- `id: string` - Track identifier
- `language: string` - Language code (e.g., "en", "es")
- `bitrate: number` - Bitrate in bits per second

### `TextTrack`

Information about a subtitle track.

**Properties:**
- `id: string` - Track identifier
- `language: string` - Language code
- `type: string` - Subtitle format (e.g., "text/vtt")

### `DownloadConfig`

Global configuration for downloads.

**Properties:**
- `updateFrequencyMS?: number` - How often to update download progress (in milliseconds)
- `maxParallelDownloads?: number` - Maximum number of simultaneous downloads

### `DRMConfig`

DRM configuration for downloading protected content.

**Properties:**
- `licenseServer: string` - URL of the license server
- `certificateUrl?: string` - Certificate URL (required for FairPlay on iOS)
- `headers?: Record<string, string>` - HTTP headers for license requests
- `getLicense?: (spcData: ArrayBuffer) => Promise<ArrayBuffer>` - Custom license acquisition function (iOS only, FairPlay)
