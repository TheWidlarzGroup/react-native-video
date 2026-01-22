---
sidebar_position: 5
sidebar_label: Chapters
description: VideoView chapters support
---

# Chapters

The `VideoView` component supports video chapters, allowing users to navigate through different segments of a video. Chapters appear as visual markers on the seekbar and can be used to jump to specific points in the video.

<video controls width="100%">
  <source src="/react-native-video/static/videos/chapters.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

## Installation

To use chapters functionality, you need to install the `@react-native-video/chapters` package:

```bash
npm install @react-native-video/chapters
```

## Getting Started

First, enable the chapters functionality by calling `enable()`:

```tsx
import { enable } from '@react-native-video/chapters';

enable();
```

## API

### `enable()`

Enables the chapters functionality. Must be called before using other chapter methods.

### `setChapters(chapters, options?)`

Sets the chapters for the video player.

**Parameters:**
- `chapters`: Array of chapter objects with the following structure:
  ```tsx
  {
    title: string;  // Chapter title
    timeMs: number; // Chapter time in milliseconds
  }[]
  ```
- `options` (optional): Configuration object
  - `markersColor?: string` - Color of the chapter markers (default: platform default)
  - `showTooltip?: boolean` - Whether to show tooltip when hovering over markers (default: `true`)
  - `showTimer?: boolean` - Whether to show timer on markers (default: `true`)

**Example:**
```tsx
import { setChapters } from '@react-native-video/chapters';

const chapters = [
  { title: "Introduction", timeMs: 0 },
  { title: "Main Content", timeMs: 30000 }, // 30 seconds
  { title: "Conclusion", timeMs: 120000 },  // 2 minutes
];

setChapters(chapters, {
  markersColor: "#FF6B35",
  showTooltip: true,
  showTimer: true,
});
```

### `clearChapters()`

Removes all chapters from the video player.

```tsx
import { clearChapters } from '@react-native-video/chapters';

clearChapters();
```

### `goToChapter(title)`

Programmatically navigates to a specific chapter by its title.

**Parameters:**
- `title`: The title of the chapter to navigate to

```tsx
import { goToChapter } from '@react-native-video/chapters';

goToChapter("Main Content");
```

## Platform Differences

- **iOS**: Custom seekbar with visual markers and tooltip
- **Android**: Visual markers on seekbar with tooltip
