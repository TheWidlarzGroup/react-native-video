# v7 — player model: `useVideoPlayer`, `VideoPlayer`, `VideoView`

## Contents
- Creating a player (`useVideoPlayer`)
- Source shape (`VideoConfig`)
- `useVideoPlayer` (hook) vs `new VideoPlayer` (class)
- `VideoPlayer` properties
- `VideoView` props
- Audio-only (no view)

## Creating a player

`useVideoPlayer(source, setup?)` creates a `VideoPlayer` and manages its lifecycle (recreated when `source` changes, released on unmount).

```tsx
const player = useVideoPlayer(
  { uri: 'https://example.com/master.m3u8' },
  (player) => {       // setup — runs once when the player starts loading; the place for initial config
    player.loop = true;
    player.volume = 0.8;
  },
);
```

> **Prefer the `setup` callback for initial configuration** (loop, volume, autoplay, muted, `playInBackground`, `showNotificationControls`, an initial `seekTo`, …). Mutating `player.x = …` in the component body runs on **every render**; the setup callback runs **once**. Use the returned `player` only for runtime interactions — button handlers and reads during render.

`source` is either a **URL string** (`'https://…'` or a `require(...)` number for local assets) or a **`VideoConfig`** object:

| `VideoConfig` field | Type | Notes |
|---|---|---|
| `uri` | `string \| number` | Required. URL or `require()` asset. |
| `headers` | `Record<string,string>` | HTTP headers (also used for the iOS DRM license request). |
| `drm` | `DrmParams` | See `drm.md` (needs the `@react-native-video/drm` plugin). |
| `bufferConfig` | `BufferConfig` | Buffer tuning — see `../shared/streaming-sources.md`. |
| `metadata` | `{ title?; subtitle?; description?; artist?; imageUri? }` | Lock-screen / notification info. |
| `externalSubtitles` | `{ uri; label; type?; language? }[]` | Sidecar subs (iOS: `.vtt` only). |
| `initializeOnCreation` | `boolean` (default `true`) | If `false`, call `player.initialize()` yourself. |

## `useVideoPlayer` (hook) vs `new VideoPlayer` (class)

Both create the same `VideoPlayer`; the hook just owns its lifecycle for you.

- **`useVideoPlayer(source, setup?)` — the default for essentially all in-component playback (~95%+).** It creates the player, recreates it when `source` changes, and **auto-releases on unmount**. It also fully covers **preloading**, deferred init (`initializeOnCreation: false` + `preload()`/`initialize()`), and **feed/list patterns** (`preload()` + `replaceSourceAsync()`) — you do **not** need the class for those.
- **`new VideoPlayer(source)` — when the player must live *outside* one component's lifecycle.** The main reason to pick the class: a player that must **outlive the component** that created it — kept alive across screens/navigation, or owned by app-level state. (Rarer: **non-React contexts** with no component to attach a hook to, e.g. a background-audio service or library/plugin code.) Either way **you own `player.release()`** — the auto-cleanup safety net is gone.

```tsx
// only for non-React / outlive-the-component cases — you must release() it yourself
const player = new VideoPlayer({ uri });
// …later, when truly done:
player.release();
```

> Rule of thumb: in a component → **hook** (yes, even for preloading and feeds). Drop to the class mainly when the player must **outlive its component** (or, rarely, there's no component to attach to). Set initial config in the `setup` callback (hook) or right after `new VideoPlayer` (class), never in render.

## `VideoPlayer` properties

**Read/write:** `volume` (0–1), `currentTime` (seconds), `muted`, `loop`, `rate` (1 = normal, 0 = pause), `playInBackground`, `playWhenInactive` (iOS), `showNotificationControls`, `mixAudioMode` (`'mixWithOthers'|'doNotMix'|'duckOthers'|'auto'`), `ignoreSilentSwitchMode` (iOS: `'auto'|'ignore'|'obey'`).

**Read-only:** `status` (`'idle'|'loading'|'readyToPlay'|'error'`), `duration` (seconds, `NaN` if unknown), `isPlaying`, `source`, `selectedTrack`.

## `VideoView` props

Extends RN `ViewProps`, plus:

| Prop | Type | Default | Notes |
|---|---|---|---|
| `player` | `VideoPlayer` | — | **Required.** |
| `controls` | `boolean` | `false` | Native playback controls. |
| `resizeMode` | `'contain'\|'cover'\|'stretch'\|'none'` | `'none'` | `'none'` ≈ contain. |
| `pictureInPicture` | `boolean` | `false` | Show the PiP button. |
| `autoEnterPictureInPicture` | `boolean` | `false` | Auto-enter PiP on background. |
| `keepScreenAwake` | `boolean` | `true` | Keep screen on while mounted. |
| `surfaceType` | `'surface'\|'texture'` | `'surface'` | Android only: `texture` is animatable, `surface` is more performant. |

For a placeholder/poster, overlay your own `<Image>` and remove it on the `onReadyToDisplay` event. See `pip-fullscreen-controls.md` for the imperative ref (`enterFullscreen`, `enterPictureInPicture`, …) and `events.md` for view events.

## Audio-only (no view)

react-native-video doubles as a solid **audio-only** player — if it's already in your app, audio playback is essentially free (no extra dependency). You don't render a `VideoView` at all; just create the player and `play()`:

```tsx
// autoplay via the setup callback (runs once) — not by mutating the player in render
const player = useVideoPlayer({ uri: 'https://example.com/audio.m3u8' }, (player) => player.play());
```

> For lock-screen / background audio, set `player.playInBackground = true` + `player.showNotificationControls = true` and pass `metadata` — see `../shared/background-playback.md`.

> Source is immutable after creation — to change it, call `player.replaceSourceAsync(newSource)` (see `playback-control.md`).
