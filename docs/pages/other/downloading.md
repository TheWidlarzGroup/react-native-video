# Offline Video SDK

## What is the Offline Video SDK?

The [Offline Video SDK](https://www.thewidlarzgroup.com/offline-video-sdk/?utm_source=rnv&utm_medium=docs&utm_campaign=downloading&utm_id=offline-video-sdk-link) extends `react-native-video` (v6 or v7) with the ability to download and store video content for offline playback. It also supports DRM-protected content. The SDK manages background tasks—such as queuing, pausing, resuming, and tracking progress or errors—without requiring major changes to your existing setup.

### Key Features

- **Stream Downloading**  
  The SDK allows you to download streams and store them for offline playback. It also includes an asset manager to manage downloaded files on the device.

- **Offline DRM**  
  Securely plays DRM-protected content offline while ensuring content protection and rights management.

### Additional Capabilities

- **Multiple Audio Tracks & Subtitles**  
  Supports downloading various audio and subtitle tracks, including optional subtitle exclusion or inclusion.

- **Selective Downloads**  
  Only the selected tracks (resolution, language, etc.) is downloaded by default to optimize storage usage.

- **DRM License Optimization**  
  If your DRM provider issues persistent tokens, they can be stored and updated only upon expiration, reducing licensing costs.

- **Pluggable Architecture**  
  Designed for offline capabilities without restricting additional video player features. Future `react-native-video` (v7+) updates will further simplify plugin integrations.

### Implementation & Support

- **Integration Options**  
  You can integrate the SDK yourself or get assistance from our team. We also offer commercial collaboration for stalled projects. [Contact us](mailto:hi@thewidlarzgroup.com) for support.

- **Basic Requirements**
  1. `react-native-video` version **6** or **7**.
  2. Actual stream downloads are required for offline playback. A content ID or persistent key alone is not sufficient.

### Licensing & Inquiries

For licensing, trials, or further assistance, [contact us](mailto:hi@thewidlarzgroup.com). We’d be happy to discuss your needs and answer any questions.
