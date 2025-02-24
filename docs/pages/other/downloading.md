# Downloading

Our Offline Video SDK lets you download and store video content for offline playback. It works with react-native-video, handling both HLS and DASH streams. You can pick specific bitrates or tracks (including audio and subtitles), and the SDK takes care of all the background tasks—queuing, resuming, and notifying about progress or errors. By simplifying how downloads are managed and stored, it ensures a reliable, user-friendly offline experience without forcing you to alter your existing video workflows.

### 1. **Does Offline Video SDK support multiple audio tracks?**
**Answer:** Yes! The same applies to subtitles.

---

### 2. **I have subtitles from a different platform. Will they work?**
**Answer:** As long as it’s a supported format for that platform.

---

### 3. **Does HLS work on Android?**
**Answer:** Yes, HLS videos work on Android and can be downloaded. However, if you’re using DRM on Android, only DASH is supported—which our SDK provides.

---

### 4. **I use the XYZ DRM provider. Will it work in my case?**
**Answer:** To check if your provider supports offline playback, you need to verify whether it allows downloading Persistent Tokens.

---

### 5. **Offline playback still doesn't work when I add react-native-video contentID with a persistent key.**
**Answer:** For offline playback, you also need to download the streams. Providing only a contentID with a persistent key won’t do the trick.

---

### 6. **Can this SDK help reduce my DRM provider costs?**
**Answer:** Yes! One of our plugins, **DRM-license downloader**, stores persistent tokens and updates them only when they expire, rather than every time a video is played. This can help optimize costs.

---

### 7. **Who will implement this SDK? Our team abandoned the project after encountering the first bug in react-native-video.**
**Answer:** Our team can handle the SDK implementation as part of a commercial cooperation. We are also available to assist or support your team during the implementation process, or you can integrate it yourself if you prefer.

---

### 8. **Will Offline Video SDK download all the content specified in an m3u8/mpd file?**
**Answer:** Fortunately, it doesn’t. The SDK allows you to select specific resolutions or tracks. If no selection is made, the default track will be downloaded. This helps prevent unnecessary memory usage when downloading videos. Developers can, for example, select which audio track to download based on the user’s location, but downloading multiple tracks is also supported.

---

### 9. **Can I add more features to the app?**
**Answer:** This solution targets a specific case and doesn’t prevent you from adding more to your video implementation. In fact, the upcoming `react-native-video` version 7 will promote a pluggable architecture, making it even easier to add features without forking the library. You won’t need to rely entirely on a proprietary player—only for the parts you need, such as offline capabilities.

---

### 10. **How does the licensing model work? Is there a free trial?**
**Answer:** Reach out to us!



### Restrictions

You need to already use react-native-video version 6 or 7. 
