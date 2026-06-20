# v6 — DRM (built-in `drm` prop)

In v6, DRM is **built into the core** — no extra package. Configure it via the `drm` prop on `<Video>`.

```tsx
import Video, { DRMType } from 'react-native-video';

<Video
  source={{ uri: 'https://example.com/manifest.mpd' }}
  drm={{
    type: DRMType.WIDEVINE,                          // enum, not a string
    licenseServer: 'https://license.example.com/wv', // note: licenseServer
    headers: { 'X-AxDRM-Message': '<token>' },       // used on iOS AND Android
  }}
/>;
```

## `drm` fields

| Field | Type | Platform | Notes |
|---|---|---|---|
| `type` | `DRMType` enum | all | `WIDEVINE \| PLAYREADY \| CLEARKEY` (Android), `FAIRPLAY` (iOS). |
| `licenseServer` | `string` | all | License server URL. |
| `headers` | `object` | all | License request headers (both platforms in v6). |
| `getLicense` | `(spc, contentId, licenseUrl, loadedLicenseUrl) => base64` | iOS | Custom CKC fetch (positional args). |
| `certificateUrl` | `string` | iOS | FairPlay certificate. |
| `base64Certificate` | `boolean` | iOS | Whether the cert URL returns base64. |
| `contentId` | `string` | iOS | Override content id. |
| `multiDrm` | `boolean` | Android | Key rotation. |
| `localSourceEncryptionKeyScheme` | `string` | iOS | Local asset key scheme. |

Full reference: https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/drm

> **v7 is completely different here:** DRM moves to the separate `@react-native-video/drm` package (`enable()` + `source.drm`), with renamed fields (`licenseServer`→`licenseUrl`, `multiDrm`→`multiSession`, enum→string union, changed `getLicense` signature, `base64Certificate`/`localSourceEncryptionKeyScheme` dropped). If you're setting up DRM fresh on a modern stack, prefer v7. See `../v7/drm.md` and `../migration-v6-to-v7.md`.

> DRM doesn't work on the iOS Simulator / Android Emulator — test on a real device (both versions).
