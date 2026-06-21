# v7 — DRM (separate `@react-native-video/drm` package)

> **v7 DRM is completely different from v6.** In v6, DRM is the built-in `<Video drm>` prop; in v7 it's a **separate plugin** you install, `enable()` at startup, and configure via `source.drm`. Follow the v7 setup below — v6 `drm`-prop guides don't apply.

## 1. Install

```sh
npm install react-native-video @react-native-video/drm react-native-nitro-modules
cd ios && pod install
```

Autolinks on both platforms (Expo: prebuild only — not Expo Go).

## 2. Enable once at startup (before any player)

```ts
import { enable } from '@react-native-video/drm';
enable();   // iOS auto-enables, Android requires it — always call; it's idempotent
```

Forgetting this → a `DRMPluginNotFound`-style error when a DRM source loads.

## 3. Configure via `source.drm`

```tsx
import { Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'react-native-video';
import { enable } from '@react-native-video/drm';
enable();

const source = Platform.OS === 'android'
  ? { // Widevine (DASH .mpd)
      uri: 'https://example.com/manifest.mpd',
      drm: {
        // type defaults to 'widevine' on Android
        licenseUrl: 'https://license.example.com/widevine',
        licenseHeaders: { 'X-AxDRM-Message': '<token>' }, // Android: headers on the LICENSE request
      },
    }
  : { // FairPlay (HLS .m3u8)
      uri: 'https://example.com/master.m3u8',
      headers: { Authorization: 'Bearer <token>' },       // iOS: used for the default license request
      drm: {
        // type defaults to 'fairplay' on Apple
        certificateUrl: 'https://license.example.com/fps-cert',
        licenseUrl: 'https://license.example.com/fps',
      },
    };

function Player() {
  const player = useVideoPlayer(source);
  return <VideoView player={player} style={{ flex: 1 }} />;
}
```

## `DrmParams` fields

| Field | Type | Platform | Notes |
|---|---|---|---|
| `type` | `'widevine' \| 'fairplay' \| string` | all | Default: Android→widevine, Apple→fairplay. |
| `licenseUrl` | `string` | all | License server URL (required for the default license flow on both platforms). |
| `certificateUrl` | `string` | iOS/visionOS | FairPlay app certificate (**required for FairPlay**). |
| `contentId` | `string` | iOS/visionOS | Derived from the `skd://` key URL if omitted. |
| `licenseHeaders` | `Record<string,string>` | **Android** | Headers on the license request. |
| `multiSession` | `boolean` | **Android** | Multiple Widevine sessions / key rotation. |
| `getLicense` | `(payload) => Promise<string>` | **iOS** | Custom CKC fetch; resolve a base64 CKC. Payload: `{ contentId, licenseUrl, keyUrl, spc }`. |

## Gotchas

- **DRM testing:** prefer a real device. The **iOS Simulator** has no FairPlay (returns no DRM manager) — a real iOS device is required. The **Android emulator** should generally handle Widevine DRM fine; if you hit bugs or odd behavior there, verify on a real device before assuming it's your code.
- **Header semantics differ:** iOS uses `source.headers` for the default license request; Android uses `drm.licenseHeaders`.
- Android automatically retries the license up to 3× and falls back to Widevine **L3** after the first failure.
- **Offline + DRM** (persistent licenses for downloaded content) is **not** in this plugin — see the Offline SDK in `../extensions.md`.
- **Token/license expiry:** fetch a *fresh* token inside `getLicense` (iOS) or use a short-lived `licenseUrl`/`licenseHeaders` (Android) — don't bake a static token into `headers`. If a token expires mid-playback, reload via `replaceSourceAsync`.

Migration of v6 `drm` props (`licenseServer`→`licenseUrl`, `multiDrm`→`multiSession`, enum→string, etc.) → `../migration-v6-to-v7.md`.
