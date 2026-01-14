---
sidebar_position: 5
sidebar_label: drm downloading
description: Downloading and playing DRM-protected content offline
---

# DRM Downloading

The Offline Video SDK supports downloading and playing DRM-protected content offline, including support for persistent licenses.

## Prerequisites

:::warning Critical Requirement
Your DRM provider **must support persistent/offline licenses**. Not all DRM providers support this feature. Contact your DRM provider to confirm offline license support before implementing.
:::

To download DRM-protected content, you need:

- **Encrypted media**: Video content encrypted with DRM (Widevine, FairPlay, PlayReady)
- **License server**: A license server that supports **persistent/offline licenses**
- **Short-lived token**: Authentication token for license acquisition (if required)

## High-level Flow

1. **Content Preparation**: Media is encrypted and packaged with DRM
2. **License Server Configuration**: License server is configured to issue persistent licenses
3. **Download with DRM Config**: Call `downloadStream` with DRM configuration
4. **License Acquisition**: SDK automatically acquires and stores persistent license
5. **Offline Playback**: Downloaded content can be played offline using the stored license

## Configuration

The `drm` property in `downloadStream` accepts a `DRMConfig` with the following properties:
- `licenseServer: string` - URL of the license server
- `certificateUrl?: string` - Certificate URL (required for FairPlay on iOS)
- `headers?: Record<string, string>` - HTTP headers for license requests
- `getLicense?: (spcData: ArrayBuffer) => Promise<ArrayBuffer>` - Custom license acquisition function (iOS only, FairPlay)

See [DRMConfig](./downloading.md#drmconfig) in API Reference for complete type definition.

### Basic DRM Configuration

```tsx
import { downloadStream } from "@TheWidlarzGroup/react-native-video-stream-downloader";

await downloadStream(videoUrl, {
  drm: {
    licenseServer: "https://license.example.com/acquire",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
    },
  },
});
```

### FairPlay (iOS)

For FairPlay on iOS, you also need to provide the certificate URL:

```tsx
await downloadStream(videoUrl, {
  drm: {
    licenseServer: "https://license.example.com/acquire",
    certificateUrl: "https://license.example.com/certificate.cer",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
    },
  },
});
```

### Custom License Acquisition (iOS only)

On iOS, you can provide a custom license acquisition function:

```tsx
await downloadStream(videoUrl, {
  drm: {
    licenseServer: "https://license.example.com/acquire",
    certificateUrl: "https://license.example.com/certificate.cer",
    getLicense: async (spcData: ArrayBuffer) => {
      // Custom license acquisition logic
      const response = await fetch("https://license.example.com/acquire", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Authorization": "Bearer YOUR_TOKEN",
        },
        body: spcData,
      });
      return await response.arrayBuffer();
    },
  },
});
```

## Platform-Specific Notes

### Android

- Supports Widevine and PlayReady
- License acquisition is handled automatically by the SDK
- Ensure your license server supports persistent licenses

### iOS

- Supports FairPlay
- Requires `certificateUrl` for FairPlay
- Custom license acquisition via `getLicense` is optional but available
- FairPlay configuration should match your `react-native-video` DRM setup

## Testing

:::tip
Always test DRM downloading on a **real device**. Simulators/emulators may not properly handle DRM operations.
:::

When testing:
1. Ensure your test content is properly encrypted
2. Verify your license server supports persistent licenses
3. Test on both iOS and Android devices
4. Verify offline playback works after download completes
5. Test license expiration scenarios

## FairPlay Notes

The FairPlay configuration for offline downloading should match your `react-native-video` DRM configuration exactly. Use the same:
- `licenseServer` URL
- `certificateUrl`
- `headers` (if applicable)
- `getLicense` function (if using custom acquisition)

This ensures consistency between online and offline playback.
