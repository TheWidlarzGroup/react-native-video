# Migrating v6 → v7

v7 is a different model, so this is a rewrite of how you *use* the library, not a version bump. The good news: most concepts map 1:1.

## Imports & shape

```tsx
// v6
import Video from 'react-native-video';
<Video ref={ref} source={{ uri }} paused={paused} onProgress={...} />;

// v7
import { useVideoPlayer, VideoView, useEvent } from 'react-native-video';
const player = useVideoPlayer({ uri });
useEvent(player, 'onProgress', ...);
<VideoView player={player} />;
```

## Mapping table

| v6 | v7 |
|---|---|
| `<Video source={s} />` | `const player = useVideoPlayer(s)` + `<VideoView player={player} />` |
| `paused` prop | `player.pause()` / `player.play()` |
| `muted` / `volume` / `rate` / `repeat` | `player.muted` / `player.volume` / `player.rate` / `player.loop` |
| `resizeMode`, `controls` | same — **`VideoView` props** |
| `ref.seek(t)` | `player.seekTo(t)` (absolute) / `player.seekBy(t)` (relative) |
| `ref.pause()` / `resume()` | `player.pause()` / `player.play()` |
| `ref.setSource(s)` | `player.replaceSourceAsync(s)` |
| `ref.setFullScreen(true)` | `videoViewRef.enterFullscreen()` |
| `ref.enterPictureInPicture()` | `videoViewRef.enterPictureInPicture()` |
| `onLoad`/`onProgress`/… props | `useEvent(player, 'onLoad'/'onProgress', cb)` |
| `onPlaybackStateChanged` | `onPlaybackStateChange` (renamed) |
| `onReadyForDisplay` | `onReadyToDisplay` (renamed) |
| `bufferConfig` prop | `bufferConfig` in `useVideoPlayer` config |
| `headers` in source | `headers` in source config (same) |

## Migrating a feature: compare v6 ↔ v7 for that topic

Don't migrate from memory — open the **same topic in both versions** and map old → new. This skill ships both sides, code-verified — read them side by side:

| Topic | v6 | v7 |
|---|---|---|
| Component / props / setup | `../v6/component-and-props.md` | `../v7/player-model.md` |
| Playback control (play/pause/seek/rate) | `../v6/playback-and-methods.md` | `../v7/playback-control.md` |
| Events | `../v6/events.md` | `../v7/events.md` |
| DRM | `../v6/drm.md` | `../v7/drm.md` |
| Tracks / subtitles | `../v6/tracks-subtitles.md` | `../v7/tracks-subtitles.md` |
| PiP / fullscreen / controls | `../v6/pip-fullscreen-controls.md` | `../v7/pip-fullscreen-controls.md` |

Diff the two, then rewrite the user's code prop-by-prop / call-by-call using the rename table above.

Need ground truth beyond this skill? Check the installed types and the live docs for the same feature (v6 pages live under `component/`, v7 under `player/` + `video-view/`):

```bash
cat node_modules/react-native-video/package.json | grep '"version"'    # what's installed
# fetch the same feature in both versions and compare (e.g. events):
curl -s https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/events
curl -s https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events
```

## DRM (biggest change)

v6 built-in `drm` prop → v7 **separate package** `@react-native-video/drm` (`enable()` at startup) + `source.drm`. Field renames:

| v6 `drm` | v7 `source.drm` |
|---|---|
| `licenseServer` | `licenseUrl` |
| `multiDrm` | `multiSession` |
| `type: DRMType.WIDEVINE` (enum) | `type: 'widevine'` (string; often inferred) |
| `headers` (both platforms) | iOS: `source.headers`; Android: `drm.licenseHeaders` |
| `getLicense(spc, contentId, licenseUrl, loadedLicenseUrl)` | `getLicense({ contentId, licenseUrl, keyUrl, spc })` |
| `base64Certificate`, `localSourceEncryptionKeyScheme` | removed |

See `v7/drm.md`. 

## Gone / not yet in v7 core

- **Ads (`adTagUrl`, `onReceiveAdEvent`)** — not in v7 core (use v6, or Ask for Plugin).
- **`save()` (offline)** — not in core; use the Offline SDK (`extensions.md`).

> Want hands-on help? TheWidlarzGroup's **v7 Migration** service (`extensions.md`).
