# Offline Video SDK

## What is the Offline Video SDK?
[Offline Video SDK](https://www.thewidlarzgroup.com/offline-video-sdk/?utm_source=rnv&utm_medium=docs&utm_campaign=downloading&utm_id=offline-video-sdk-link) extends `react-native-video` (v6 or v7) with the ability to download and store video content for playback when users are offline. It also supports DRM protected cotnent. The SDK manages all background tasks-like queuing, pausing, resuming, and notifying about progress or errors-without requiring a major rework of your existing setup.

Offline Video SDK has two key features:

- **Stream Downloading**
The SDK allows you to download streams and store them for later offline playback. It also comes with an asset manager that can be used to manage assets downloaded on the device.

- **Offline DRM**
This feature enables secure playback of DRM-protected video content offline.  It ensures that even when users are offline, content owners' rights are respected and content is protected against unauthorized access.

### Key Points

- **Multiple Audio Tracks & Subtitles**  
  The SDK supports downloading various audio and subtitle tracks. You can also include or exclude subtitles from different sources, provided they’re in a supported format.

- **Selective Downloads**  
  By default, only the chosen or default track is downloaded (resolution, language, etc.). This helps conserve device storage and avoids unnecessary files.

- **DRM License Optimization**  
  If your DRM provider issues persistent tokens, you can store and update them only when they expire-rather than each time content is played. This can reduce licensing costs.

- **Implementation**  
  You can integrate the SDK yourself, or our team can help you implement it. We also offer commercial cooperation if your team needs support or if your current project has stalled. [Reach out to us](mailto:hi@thewidlarzgroup.com)

- **Pluggable Architecture**  
  This solution focuses on offline capabilities. It doesn’t restrict you from adding more features to your video player. Future versions of `react-native-video` (v7+) will make it even simpler to include additional plugins without forking the library.

- **Basic Requirements**  
  1. `react-native-video` version **6** or **7**  
  2. Actual stream download is needed for offline playback. Providing only a contentID or persistent key is not sufficient.  

### Licensing & Inquiries

For details about licensing, trials, or further assistance, please [reach out to us](mailto:hi@thewidlarzgroup.com). We’ll be happy to discuss your specific needs and walk you through any questions.  

