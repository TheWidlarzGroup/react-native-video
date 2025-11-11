# @react-native-video/drm

DRM plugin for react-native-video. It adds Widevine (Android) and FairPlay (iOS, visionOS) playback support via the react-native-video plugin system.

## Requirements

- react-native-video >= 7.0.0-alpha.3
- react-native-nitro-modules >= 0.27.2

## Installation

```sh
npm install @react-native-video/drm react-native-video react-native-nitro-modules
# then for iOS
npx pod-install
```

Notes
- This library uses Nitro Modules; autolinking is supported. No manual native changes are needed besides running CocoaPods on iOS.
- On Expo, use a prebuild workflow (npx expo prebuild) — pure managed apps aren’t supported.

## Quick start

Enable the plugin once at app start, then pass DRM params on your video source.

```tsx
import React from 'react';
import { Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'react-native-video';
import { enable, isEnabled } from '@react-native-video/drm';

// Enable at startup (required on Android; safe on iOS)
enable();

export default function Player() {
	const player = useVideoPlayer({
		uri: 'https://example.com/stream.m3u8',
		// Request headers used by the media request and (on iOS default flow) the license request
		headers: { Authorization: 'Bearer <token>' },
		drm: {
			// Optional: defaults to platform (fairplay on Apple, widevine on Android)
			type: Platform.select({ ios: 'fairplay', default: 'widevine' }),

			// Android (Widevine)
			licenseUrl: 'https://license.example.com/widevine',
			licenseHeaders: { 'x-custom': 'value' },
			multiSession: true,

			// iOS (FairPlay)
			// For FairPlay provide certificateUrl and (optionally) contentId.
			// When contentId is not provided, the plugin tries to infer it from the skd:// key URL.
			certificateUrl: Platform.OS === 'ios' ? 'https://license.example.com/fps.cer' : undefined,
		},
	});

	return <VideoView player={player} style={{ flex: 1 }} />;
}
```

## API

From `@react-native-video/drm`:

- `enable(): void` — registers the plugin. Call once during app startup (Android requires it; iOS tries to auto-enable, but calling is safe).
- `disable(): void` — unregisters the plugin.
- `isEnabled: boolean` — plugin registration status.

DRM params (provided via `useVideoPlayer({ drm: ... })` or equivalent config in react-native-video):

- `type?: 'widevine' | 'fairplay' | string` — DRM system. Defaults: Android → widevine, Apple → fairplay.
- `licenseUrl?: string` — license server URL. Required for both Widevine and FairPlay default flows.
- `licenseHeaders?: Record<string, string>` — headers for license requests (Android only).
- `multiSession?: boolean` — allow multiple sessions (Android only).
- `certificateUrl?: string` — FairPlay application certificate URL (iOS/visionOS).
- `contentId?: string` — FairPlay content ID (iOS/visionOS). If omitted, inferred from `skd://` key URL when possible.
- `getLicense?: (payload) => Promise<string>` — iOS custom license fetch. Receives `{ contentId, licenseUrl, keyUrl, spc }` and must resolve to a base64-encoded CKC.

## Platform notes

- iOS/visionOS
	- FairPlay is not supported on the simulator — test on a real device.
	- Default license flow posts SPC bytes to `licenseUrl` and uses `source.headers` (not `licenseHeaders`). Use `getLicense` for full control.
	- Provide `certificateUrl`; set `contentId` if your server needs it.
- Android
	- Widevine is handled via ExoPlayer (Media3). Use `licenseHeaders` for request headers and `multiSession` if needed.

## Troubleshooting

- “Failed to fetch certificate/license” — verify URLs are reachable and correct, and that headers/tokens are included. On iOS default flow, set headers in `source.headers`.
- “Unsupported DRM type” — set `drm.type` appropriately or omit it to use platform defaults.
- “DRM not working on simulator” — FairPlay does not work on the iOS simulator.

## License

MIT
