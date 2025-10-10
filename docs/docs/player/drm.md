---
sidebar_position: 3
sidebar_label: DRM
---

# DRM

## What is DRM (Digital Rights Management)?
DRM is a set of access control technologies that are used to protect copyrighted content from unauthorized use and distribution. It allows content owners to control how their digital media is used and distributed.

### When do you need it?
If you are working with copyrighted content and want to prevent unauthorized access or distribution, you will need DRM. It is especially important for streaming services, e-learning platforms, and any application that delivers premium content that you want to protect from piracy.

### What next?
This page explains how to play DRM‑protected content with React Native Video using the official DRM plugin. It covers installing and enabling the plugin, configuring sources with DRM, and platform‑specific notes for Android (Widevine) and iOS/visionOS (FairPlay).

## Install and enable the DRM plugin

:::tip Pluginable Architecture
React Native Video uses a plugin architecture. DRM support is provided by the `@react-native-video/drm` plugin and is not built into the core package.
:::

1) Install dependencies in your app:

```sh
npm install @react-native-video/drm
```

2) Enable the plugin at app startup (before creating any players):

```ts
// App.tsx (or any place you want to initialize the plugin)
import { enable } from '@react-native-video/drm';

enable();
```

The plugin autolinks on both Android and iOS. Nitro Modules are required because the plugin uses Nitro under the hood.

## Quick start

You pass DRM configuration via `VideoConfig.drm` when creating a player or using the `useVideoPlayer` hook. If `drm.type` is omitted, the default is inferred per platform (`widevine` on Android, `fairplay` on iOS/visionOS).

```tsx
import { VideoView, useVideoPlayer } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer({
    source: {
    uri: 'https://example.com/manifest.mpd', // or HLS .m3u8 for FairPlay
    // On iOS these headers are also used for the default license request
    headers: { Authorization: 'Bearer <token>' },
    drm: {
      // type: 'widevine' | 'fairplay'  // optional; inferred by platform
      licenseUrl: 'https://license.example.com/widevine',
    },
  },
  });

  return <VideoView player={player} />;
}
```

:::warning
You shouldn't include your authorization token directly in the code. Instead, use a backend method to retrieve it at runtime.
:::

## DRM config reference

All properties are optional unless marked otherwise for a platform. The table below describes each property, the expected type, platforms where it applies, whether it's required, and important notes.

| Property | Type | Platform | Required | Notes |
|---|---:|---|:---:|---|
| `type` | `'widevine' \| 'fairplay'` | Android, iOS, visionOS | No (defaulted) | Default inferred per platform when `drm` is present and `type` omitted (Android → `widevine`, iOS/visionOS → `fairplay`). |
| `licenseUrl` | `string` | Android, iOS, visionOS | Android: Yes; iOS/visionOS: Yes for default/custom flows | URL of the license (CKC) service. Required for license acquisition. |
| `licenseHeaders` | ``Record<string, string>`` | Android | No | Extra headers sent with the Widevine license request. (On iOS, use `source.headers` for license requests.) |
| `multiSession` | `boolean` | Android | No | Whether to allow multiple Widevine sessions. |
| `certificateUrl` | `string` | iOS, visionOS | Yes (for FairPlay) | URL to fetch the FairPlay application certificate (used to create the SPC). |
| `contentId` | `string` | iOS, visionOS | No | If omitted, derived from the `skd://` key URL. Used when creating the SPC. |
| `getLicense` | ``(payload) => Promise<string>`` | iOS, visionOS | No | Optional hook for custom FairPlay license logic; must resolve to a base64‑encoded CKC string. |

Payload shape passed to `getLicense` (iOS/visionOS):

| Field | Type | Description |
|---|---:|---|
| `contentId` | `string` | Content identifier for the asset. If not provided the player will try to derive it from the `skd://` key URL. |
| `licenseUrl` | `string` | The license server URL that should be used for license acquisition. |
| `keyUrl` | `string` | The key URL/identifier received from the stream (typically an `skd://` URL). |
| `spc` | `string` | The SPC (secure playback context) as a base64‑encoded string. Send raw SPC bytes to your license server (server side may expect raw bytes rather than base64). |

## Android: Widevine

- Set `drm.type` to `'widevine'` or omit it (the library will default to Widevine on Android if `drm` is present).
- `licenseUrl` is required; `licenseHeaders` and `multiSession` are optional.
- Implementation details:
	- The plugin uses ExoPlayer’s `DefaultDrmSessionManager` and `HttpMediaDrmCallback` with your `licenseUrl` and `licenseHeaders`.
	- If a first attempt fails due to device security level issues, the plugin retries with `L3` security level.

Example:

```tsx
useVideoPlayer({
  source: {
    uri: 'https://example.com/manifest.mpd',
    drm: {
      // type: 'widevine', // optional
      licenseUrl: 'https://license.example.com/widevine',
      licenseHeaders: { 'X-Custom-Header': 'value' },
      multiSession: false,
    },
  },
});
```

## iOS and visionOS: FairPlay

Two ways to get the CKC (license):

1) Default flow (no `getLicense`):
	 - Required: `certificateUrl`, `licenseUrl`.
	 - The plugin requests the application certificate, generates the SPC, then POSTs the SPC to `licenseUrl`.
	 - It uses `source.headers` (not `drm.licenseHeaders`) for the license request.

2) Custom flow (provide `getLicense`):
	 - Required: `certificateUrl`, `licenseUrl`, and a `getLicense` implementation.
	 - You receive `{ contentId, licenseUrl, keyUrl, spc }` and must return a base64‑encoded CKC string.

Notes:
- DRM isn’t supported in the iOS Simulator; the plugin returns `null` for DRM in Simulator builds.
- If `contentId` isn’t provided, it is derived from the `skd://` key URL.

Default flow example:

```tsx
useVideoPlayer({
  source: {
    uri: 'https://example.com/fairplay.m3u8',
    headers: { Authorization: 'Bearer <token>' }, // used for the license request
    drm: {
      // type: 'fairplay', // optional
      certificateUrl: 'https://license.example.com/fps-cert',
      licenseUrl: 'https://license.example.com/fps',
      // contentId: 'my-content-id', // optional
    },
  },
});
```

Custom `getLicense` example:

:::tip
This is example code for a custom `getLicense` implementation. it may differ from your actual implementation provided by your DRM provider
:::

```tsx
useVideoPlayer({
  source: {
  uri: 'https://example.com/fairplay.m3u8',
  drm: {
    certificateUrl: 'https://license.example.com/fps-cert',
    licenseUrl: 'https://license.example.com/fps',
    getLicense: async ({ contentId, licenseUrl, keyUrl, spc }) => {
      // Example: POST SPC to your license server and return base64 CKC
        const res = await fetch(licenseUrl, {
          method: 'POST',
          body: Buffer.from(spc, 'base64'), // server expects raw SPC bytes
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Content-ID': contentId,
            'X-Asset-Id': keyUrl,
          },
        });
        if (!res.ok) throw new Error(`License request failed: ${res.status}`);
        const ckc = await res.arrayBuffer();
        // return base64 CKC string
        return Buffer.from(ckc).toString('base64');
      },
    },
  },
});
```

## Offline
If you are looking for implementing offline playback with DRM, make sure to checkout our [Offline Video SDK](https://www.thewidlarzgroup.com/offline-video-sdk). It provides a comprehensive solution for downloading and playing Streams and DRM-protected content.

## Troubleshooting

- DRMPluginNotFound: Ensure you installed `@react-native-video/drm`, imported it, and called `enable()` before creating any players.
- iOS headers: The default FairPlay flow uses `source.headers` for license requests; `drm.licenseHeaders` are not used on iOS.
- Invalid CKC: `getLicense` must return a base64 string. Returning raw bytes or JSON will fail.
- 403/415 from license server: Verify required auth headers, content type, and whether the server expects raw SPC bytes vs base64.
- Android security level issues: The plugin retries with Widevine L3 if the first attempt fails.
- iOS Simulator: DRM isn’t supported in Simulator. Test on a real device.

## Notes and defaults

- If `drm` is provided without `type`, the library sets a platform default: Android → Widevine, iOS/visionOS → FairPlay.
- For custom DRM systems or advanced pipelines, you can implement your own plugin. See the Plugin Interface docs.

