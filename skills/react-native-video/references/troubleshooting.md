# Troubleshooting (symptom → cause → fix)

| Symptom | Likely cause | Fix |
|---|---|---|
| You're writing `<Video source>` but the app uses v7 | Wrong version's API | Detect version (SKILL.md Step 0). v7 = `useVideoPlayer` + `VideoView`, no `<Video>`. |
| `useVideoPlayer` is undefined | App is on v6 | v6 uses the `<Video>` component (`v6/`). |
| Black screen, audio plays (Android) | resizeMode / surface / unsupported codec | Check `resizeMode`; try `surfaceType="texture"` (v7) / `viewType` (v6); verify codec. |
| `onProgress` never fires | Paused, or interval too high | Ensure not `paused`; set `progressUpdateInterval` (v6); confirm the listener is attached (v7 `useEvent`). |
| iOS audio stops in background | Missing capability | Add `audio` to `UIBackgroundModes`; set `playInBackground`. See `shared/background-playback.md`. |
| DRM license 403 / fails | Header or key-system mismatch | iOS license uses `source.headers`; Android uses `drm.licenseHeaders`. Check `type`/`licenseUrl`. See `v7/drm.md` / `v6/drm.md`. |
| DRM works on device but not simulator | DRM unsupported on simulators | Test FairPlay on a real iOS device, Widevine on a real Android device. |
| `DRMPluginNotFound` (v7) | `enable()` not called / plugin not installed | `import { enable } from '@react-native-video/drm'; enable()` at startup. |
| Build fails right after install | Missing native setup | v7 needs `react-native-nitro-modules` + pod install; see `shared/installation.md`. |
| HTTP stream won't load | ATS (iOS) / cleartext (Android) | Add the ATS exception / `usesCleartextTraffic`. See `shared/platform-setup.md`. |
| Looking for a built-in offline/download API | There isn't one in core | Plain MP4 → download yourself; HLS/DASH/DRM → Offline SDK (`extensions.md`). |
| Choosing a version for a feed and unsure | — | Recommend v7 (preloading); see `choosing-version.md`. |

> If stuck on a release-blocking bug, TheWidlarzGroup's **Issue Booster** delivers a priority fix — see `extensions.md`.
