---
sidebar_position: 3
sidebar_label: events
description: Event system for tracking download progress and status
---

# Events

The Offline Video SDK emits events that allow you to monitor and react to changes in download status and progress. You can subscribe to these events using the `useEvent` hook from `react-native-video`.

## Available Events

### `onError`

Fired when an error occurs during download.

**Callback signature:**
```tsx
(error: string) => void
```

**Parameters:**
- `error`: Error message describing what went wrong

```tsx
import { useEvent } from "react-native-video";

useEvent("onError", (error: string) => {
  console.error("Download error:", error);
});
```

### `onDownloadProgress`

Fired periodically during downloads with current progress information.

**Callback signature:**
```tsx
(downloads: DownloadStatus[]) => void
```

**Parameters:**
- `downloads`: Array of `DownloadStatus` - See [DownloadStatus structure](./downloading.md#downloadstatus) in API Reference for complete properties

```tsx
import { useEvent } from "react-native-video";

useEvent("onDownloadProgress", (downloads: DownloadStatus[]) => {
  downloads.forEach((download) => {
    console.log(`Download ${download.id}: ${(download.progress * 100).toFixed(1)}%`);
  });
});
```

### `onDownloadEnd`

Fired when a download completes (successfully or with failure).

**Callback signature:**
```tsx
(download: DownloadStatus) => void
```

**Parameters:**
- `download`: Final `DownloadStatus` - See [DownloadStatus structure](./downloading.md#downloadstatus) in API Reference for complete properties. When this event fires, `status` will be either `'completed'` or `'failed'`.

```tsx
import { useEvent } from "react-native-video";

useEvent("onDownloadEnd", (download: DownloadStatus) => {
  if (download.status === "completed") {
    console.log(`Download ${download.id} completed successfully`);
  } else {
    console.log(`Download ${download.id} failed`);
  }
});
```

## Using Events

Events are automatically typed and can be used with the `useEvent` hook from `react-native-video`:

```tsx
import { useEvent } from "react-native-video";

function DownloadManager() {
  useEvent("onDownloadProgress", (downloads) => {
    // Update UI with progress
  });

  useEvent("onDownloadEnd", (download) => {
    // Handle completion
  });

  useEvent("onError", (error) => {
    // Handle errors
  });

  // ... rest of component
}
```

The `useEvent` hook automatically manages cleanup when the component unmounts, preventing memory leaks.
