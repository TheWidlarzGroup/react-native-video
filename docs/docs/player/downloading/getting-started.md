---
sidebar_position: 1
sidebar_label: getting started
description: Installation and setup guide for Offline Video SDK
---

# Getting Started

:::warning API Key Required
To use the Offline Video SDK, you need an API key. You can obtain it by:
- Contacting TheWidlarzGroup directly at [hi@thewidlarzgroup.com](mailto:hi@thewidlarzgroup.com)
- Logging in through the SDK platform at [sdk.thewidlarzgroup.com](https://sdk.thewidlarzgroup.com)

Once you have your API key, you'll need to authorize the plugin (see Authorization section below).
:::

The Offline Video SDK is a commercial add-on for `react-native-video` (versions 6 and 7) that enables secure offline playback of HLS streams, including support for DRM, multiple audio tracks, and subtitles.

## Requirements

- **React Native Video**: version 6.15.0 or higher (versions 6 and 7 are supported)
- **iOS**: 15.0 or higher
- **Android**: 6.0 or higher
- **License**: A valid license for the Offline Video SDK is required. You can obtain this through the SDK platform or by contacting TheWidlarzGroup directly.

## Features

- **HLS/DASH/MP4 Downloading**: Download and store video streams for offline playback
- **Asset Management**: Full control over downloaded assets
- **Offline DRM**: Supports offline playback of DRM-protected content with proper rights enforcement and license handling
- **Offline Playback**: Play downloaded content without internet connection
- **Cross-platform**: Works on both iOS and Android

## Installation

### 1. Configure npm for Private Package

Since this is a private package, configure npm to access GitHub Packages by adding the following to your `~/.npmrc` file:

```
@TheWidlarzGroup:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<NPM_GITHUB_AUTH_TOKEN>
```

Replace `<NPM_GITHUB_AUTH_TOKEN>` with your actual GitHub token. This token is different from the one used for plugin authorization.

### 2. Install the Package

Install the package using npm:

```bash
npm install @TheWidlarzGroup/react-native-video-stream-downloader
```

### 3. Android Configuration

Add the following line to your `./android/app/build.gradle` file in the `dependencies` block:

```groovy
implementation fileTree(dir: "../../node_modules/@TheWidlarzGroup/react-native-video-stream-downloader/native-libs", include: ["*.aar"])
```

Ensure the path matches your project's `node_modules` location.

### 4. iOS Configuration

No additional configuration is required for iOS; the plugin will be automatically linked.

### 5. Plugin Authorization

After installation, authorize the plugin with an API key:

```tsx
import { registerPlugin } from "@TheWidlarzGroup/react-native-video-stream-downloader";

const success = await registerPlugin("YOUR_API_KEY");
```

Replace `"YOUR_API_KEY"` with your actual API key obtained from [sdk.thewidlarzgroup.com](https://sdk.thewidlarzgroup.com) or by contacting TheWidlarzGroup at [hi@thewidlarzgroup.com](mailto:hi@thewidlarzgroup.com).

## Supported Formats

| Format | iOS | Android |
|--------|-----|---------|
| HLS | ✅ | ✅ |
| MP4 | ✅ | ✅ |
| MPEG-DASH | ❌ | ✅ |

## Licensing & Pricing

The Offline Video SDK is distributed under a commercial license. You can evaluate it for free for 14 days without a credit card. For questions or assistance, contact [hi@thewidlarzgroup.com](mailto:hi@thewidlarzgroup.com).
