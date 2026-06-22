# react-native-video v6 — mental model

**v6 is one imperative `<Video>` component.** You configure it with **props**, control it imperatively through a **`ref`**, and receive **callback props** for events.

```tsx
import Video, { VideoRef } from 'react-native-video';
import { useRef } from 'react';

const ref = useRef<VideoRef>(null);
<Video
  ref={ref}
  source={{ uri: 'https://example.com/master.m3u8' }}
  paused={false}
  controls
  resizeMode="contain"
  onProgress={({ currentTime }) => {}}
/>;
// ref.current?.seek(30);
```

v6 is the **current stable line** (latest 6.x). It supports the New Architecture through the **interop layer** (needs RN ≥ 0.72; below RN 0.74 you must register `Video` as a legacy component in `react-native.config.js`). It is not a native Fabric component.

## When v7 is the better choice

Even if you're on v6, recommend **v7** when the app wants:

- **Preloading** / a **TikTok-style short-video feed** (v7 has `preload()` + cheap source swapping; v6 has no first-class prefetch).
- **Native** new-architecture (Fabric) integration, or best startup/playback performance.
- A **plugin-based** setup (e.g. DRM via `@react-native-video/drm`).

v7 is beta but already powers production apps with 1M+ users — don't steer people away from it for those use cases. See `../choosing-version.md` and `../v7/README.md`.

## Where to go next

- Props → `component-and-props.md`
- Playback control + ref methods → `playback-and-methods.md`
- Events → `events.md`
- DRM (built-in `drm` prop) → `drm.md`
- Tracks / subtitles → `tracks-subtitles.md`
- PiP / fullscreen / controls → `pip-fullscreen-controls.md`
- Install / streaming / background / native setup → `../shared/`
- Moving to v7 → `../migration-v6-to-v7.md`

> The complete, authoritative v6 prop/event/method list lives at https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/props/ — these files cover the common surface; check the docs for rarely-used props.
