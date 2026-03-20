---
sidebar_position: 0
sidebar_label: Simple (JS Events)
description: Simple analytics using JavaScript events
---

# Simple Analytics

The easiest way to track video analytics is by using the JavaScript events provided by `react-native-video`. This approach requires no native code and works across all platforms.

## Overview

Use the `useEvent` hook to subscribe to player events. For a complete list of available events and their data, see the [Events documentation](../events.md).

## Example

```tsx
import { useVideoPlayer, useEvent, VideoView } from 'react-native-video';

function VideoPlayer() {
  const player = useVideoPlayer('https://example.com/video.mp4');

  useEvent(player, 'onLoad', (data) => {
    analytics.track('video_loaded', { duration: data.duration });
  });

  useEvent(player, 'onProgress', (data) => {
    analytics.track('video_progress', { currentTime: data.currentTime });
  });

  useEvent(player, 'onError', (error) => {
    analytics.track('video_error', { error: error.error });
  });

  useEvent(player, 'onEnd', () => {
    analytics.track('video_completed');
  });

  return <VideoView player={player} style={{ flex: 1 }} />;
}
```

## When to Use

**Use JS Events when:**
- You need basic playback tracking (play, pause, progress, errors)
- You want a quick integration without native code
- Your analytics needs are straightforward

**Consider [Manual Analytics](./manual.md) when:**
- You need low-level metrics (bitrate, dropped frames, buffer health)
- You want to integrate with native analytics SDKs
- You need the most accurate and detailed data

## Tips

1. **Throttle progress events** - `onProgress` fires frequently. Consider throttling before sending to your analytics backend.

2. **Track session data** - Store a session ID to group events from the same viewing session.

3. **Include video metadata** - Add video ID, title, or other metadata to your events for better reporting.

```tsx
const sessionId = useRef(uuid()).current;

const handleProgress = (data) => {
  // Throttle to every 10 seconds
  if (Math.floor(data.currentTime) % 10 === 0) {
    analytics.track('video_progress', {
      sessionId,
      videoId: 'video-123',
      currentTime: data.currentTime,
    });
  }
};
```
