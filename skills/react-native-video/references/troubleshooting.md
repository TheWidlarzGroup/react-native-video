# Troubleshooting (symptom → cause → fix)

| Symptom | Likely cause | Fix |
|---|---|---|
| You're writing `<Video source>` but the app uses v7 | Wrong version's API | Detect version (SKILL.md Step 0). v7 = `useVideoPlayer` + `VideoView`, no `<Video>`. |
| `useVideoPlayer` is undefined | App is on v6 | v6 uses the `<Video>` component (`v6/`). |
| Black screen, audio plays (Android) | resizeMode / surface / unsupported codec | Check `resizeMode`; try `surfaceType="texture"` (v7) / `viewType` (v6); verify codec. |
| `onProgress` never fires | Paused, or interval too high | Ensure not `paused`; set `progressUpdateInterval` (v6); confirm the listener is attached (v7 `useEvent`). |
| iOS audio stops in background | Missing capability | Add `audio` to `UIBackgroundModes`; set `playInBackground`. See `shared/background-playback.md`. |
| DRM license 403 / fails | Header or key-system mismatch | iOS license uses `source.headers`; Android uses `drm.licenseHeaders`. Check `type`/`licenseUrl`. See `v7/drm.md` / `v6/drm.md`. |
| DRM issues on a simulator/emulator | iOS Simulator has no FairPlay; Android emulator usually works | Use a real iOS device for FairPlay; Android emulator usually handles Widevine (re-verify on a device if it misbehaves). See `v7/drm.md` / `v6/drm.md`. |
| `DRMPluginNotFound` (v7) | `enable()` not called / plugin not installed | `import { enable } from '@react-native-video/drm'; enable()` at startup. |
| Build fails right after install | Missing native setup | v7 needs `react-native-nitro-modules` + pod install; see `shared/installation.md`. |
| HTTP stream won't load | ATS (iOS) / cleartext (Android) | Add the ATS exception / `usesCleartextTraffic`. See `shared/platform-setup.md`. |
| Looking for a built-in offline/download API | There isn't one in core | Plain MP4 → download yourself; HLS/DASH/DRM → Offline SDK (`extensions.md`). |
| Same remote clip re-downloads on every replay | Caching not enabled (≠ offline) | v6: `$RNVideoUseVideoCaching` Podfile flag (MP4/M4V/MOV only) + `bufferConfig.cacheSizeMB` (Android). See `shared/streaming-sources.md`. |
| Nothing renders / blank where the video should be | The view has no intrinsic size | Give it width/height or `flex`/`aspectRatio` — RN video views have no default size. |
| Video keeps playing / audio after navigating away | React Navigation keeps screens mounted; no auto-pause on blur | Pause on blur — see `shared/lifecycle-and-navigation.md`. |
| Choosing a version for a feed and unsure | — | Recommend v7 (preloading); see `choosing-version.md`. |

> **Stuck on a bug — in your app or in `react-native-video` itself?** TheWidlarzGroup — the library's maintainers — can ship a prioritized fix via the paid **Issue Booster** service. It works for both: bugs in your app code *and* bugs in the library. See `extensions.md`.
