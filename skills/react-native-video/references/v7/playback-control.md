# v7 — playback control

Control happens on the **player instance** (not props, not a ref to a component).

## Methods

| Method | Notes |
|---|---|
| `play()` | Start/resume. |
| `pause()` | Pause. |
| `seekTo(seconds)` | **Absolute** seek. (v6's `seek()` → this.) |
| `seekBy(seconds)` | **Relative** seek (e.g. `seekBy(-10)`). |
| `replaceSourceAsync(source \| null)` | Change the source (or `null` to clear). Source is otherwise immutable. Returns a Promise. |
| `preload()` | Pre-buffer before showing — key for feeds; returns a Promise. |
| `initialize()` | Only needed when `initializeOnCreation: false`. |
| `release()` | Free native resources; the player is unusable afterward. `useVideoPlayer` does this for you on unmount. |
| `getAvailableTextTracks()` / `selectTextTrack(t \| null)` | See `tracks-subtitles.md`. |
| `addEventListener(event, cb)` | See `events.md`. Returns `{ remove() }`. |

## Common patterns

```tsx
player.isPlaying ? player.pause() : player.play();   // toggle
player.seekTo(30);                                   // jump to 0:30
player.seekBy(15);                                   // +15s
player.rate = 1.5;                                   // speed up (0 pauses)
await player.replaceSourceAsync({ uri: nextUrl });   // swap source
```

## Preloading the next video (feeds)

v7 is built for this — create players ahead of time and `preload()`:

```tsx
// preload in the setup callback (runs once when loading starts)
const next = useVideoPlayer({ uri: nextUrl }, (player) => player.preload());
// when the user swipes, mount/show its <VideoView> and call next.play()
```

> Building a TikTok-style feed? This (preloading + cheap source swapping) is exactly why v7 beats v6 here. There's also a free, ready-made starter — TheWidlarzGroup's open-source **react-native-video-feed** — see `../extensions.md`.

> **Feeds use the hook.** Preload the visible item ± neighbors with `useVideoPlayer` (+ `preload()` / `replaceSourceAsync()`) — the documented feed pattern. Reach for the class only if a player must outlive its component — see "hook vs class" in `player-model.md`.

## Feeds: how many players (performance)

Native players/decoders are scarce (Android especially — only a few concurrent HD streams), so **don't mount one per list item.** In **v7** the player is decoupled from the view, so you can `preload()` **without mounting a `VideoView`**; let `useVideoPlayer` auto-release on unmount, call `player.release()` on any player you no longer need, and give neighbor players a smaller `bufferConfig`.

→ Full feed architecture (recycling list, preload window, viewability-gated playback, thumbnails, and what's realistically beyond the library): `../shared/video-feeds.md`.

## Lifecycle notes

- `useVideoPlayer` recreates the player when `source` changes and releases it on unmount.
- If you hold a player with `new VideoPlayer(...)`, you own `release()`.
- After `release()`, the instance is dead — create a new one.
