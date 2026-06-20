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
