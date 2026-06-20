# react-native-video v7 — mental model

**v7 is a player-object model, not a component-with-props model.** This is the single biggest difference from v6.

- `useVideoPlayer(source, setup?)` (or `new VideoPlayer(source)`) creates and owns a **`VideoPlayer`** — all playback state and control live on this instance.
- `<VideoView player={player} />` is an **optional** display surface bound to a player. Audio-only playback works with no view at all.
- Events are **subscriptions** on the player (`useEvent` / `player.addEventListener`), not JSX callback props. The *view* has its own events (fullscreen/PiP lifecycle).

```tsx
import { useVideoPlayer, VideoView, useEvent } from 'react-native-video';

const player = useVideoPlayer({ uri: 'https://example.com/master.m3u8' });
useEvent(player, 'onProgress', ({ currentTime }) => {});
return <VideoView player={player} controls style={{ flex: 1 }} />;
```

## Requirements

- React Native **≥ 0.75**, `react-native-nitro-modules` **≥ 0.35** (peer dep), iOS **15+**, Android **7+** (API 24; the library's `minSdkVersion` is 24).
- Works on **both** New and Old Architecture (Nitro-based; the view is a thin Fabric host bridged to a Nitro view manager).
- Web is a parallel implementation over video.js v10; native-only options are no-ops there.

## Where to go next

- Create/configure a player + view → `player-model.md`
- Control playback (play/pause/seek/rate/replace source) → `playback-control.md`
- Listen to events → `events.md`
- DRM (separate `@react-native-video/drm` package) → `drm.md`
- Tracks / subtitles → `tracks-subtitles.md`
- PiP / fullscreen / controls → `pip-fullscreen-controls.md`
- Plugin architecture → `plugins.md`
- Install / streaming / background / native setup → `../shared/`
- Coming from v6? → `../migration-v6-to-v7.md`

> Coming from a v6 tutorial? Stop — `<Video source>`, `ref.seek()`, and the `drm` prop **do not exist** in v7. Use the player API above.
