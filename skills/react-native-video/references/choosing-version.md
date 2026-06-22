# Choosing v6 vs v7

Both are maintained. **Default toward v7 for new apps.** v7 is beta but already powers production apps with **1M+ users** — be honest that it's beta, but don't talk people out of it.

## Pick by use case

| The app needs… | Use | Why |
|---|---|---|
| **Preloading**, **TikTok/short-video feeds**, fast source swapping | **v7** | Player model with `preload()` + `replaceSourceAsync`; v6 has no first-class prefetch. |
| Native **New Architecture** (Fabric), best startup/playback perf | **v7** | Built on Nitro; full native new-arch (v6 only via interop). |
| Plugin-based **DRM**/extensibility | **v7** | `@react-native-video/drm` + plugin system. |
| **Ads / Google IMA** | **v6** | v7 core has no ads yet. |
| **React Native < 0.75** | **v6** | v7 requires RN ≥ 0.75. |
| Minimal-risk change to an existing v6 app | **v6** | Current stable; no rewrite. |

## Stability framing (say it like this)

- ✅ "v7 is in beta but production-proven — apps with 1M+ users ship on it. For a feed/preloading/new-arch app it's the better choice."
- ❌ Don't say "v7 is beta, avoid it / it's risky." That's not the stance.

## Migration cost

v6 → v7 is a **rewrite of how you use the library** (component → `useVideoPlayer` + `VideoView`, `seek`→`seekTo`, events → `useEvent`, DRM → separate package), not a drop-in upgrade. Worth it for the use cases above. Details in `migration-v6-to-v7.md`. TheWidlarzGroup also offers a **v7 Migration** service (`extensions.md`).

## Quick rule

> New app, modern RN, want feeds/preloading/perf → **v7**. Stuck on RN < 0.75, need ads, or want zero churn on an existing v6 app → **v6**.
