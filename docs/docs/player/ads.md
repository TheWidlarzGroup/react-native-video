---
title: Ads — Google IMA Client-Side Ad Insertion
sidebar_position: 6
sidebar_label: Ads
description: Play pre-roll, mid-roll, and post-roll video ads with Google's IMA SDK in React Native Video — configuration, ad state, events, and platform setup for Android and iOS.
keywords: [ads, IMA, Google IMA, VAST, VMAP, ad insertion, pre-roll, mid-roll, post-roll, react native video]
---

# Ads

React Native Video supports client-side ad insertion (CSAI) via Google's IMA SDK: pre-roll, mid-roll, and post-roll ads driven by a VAST or VMAP ad tag. It's structurally enforced — no content frame renders until the ad decision has resolved, so you can't accidentally flash a frame of content before a pre-roll.

### When do you need it?

If you monetize video content with ad breaks (pre-roll before playback starts, mid-rolls at cue points, or a post-roll after the video ends), this is the built-in way to request and play those ads without adding your own player-on-top-of-a-player integration.

## Platform setup (required)

Ad support is **opt-in and off by default** on both platforms — apps that never show ads shouldn't pay the binary-size or privacy-manifest cost of linking the IMA SDK. Every ad API (`ads` config, `activateAds()`, `isPlayingAd`, `adState`, ad events) stays present either way, but **silently does nothing** until you enable the flag for your platform: `activateAds()` resolves immediately, the playback gate never closes, and no ad events fire. There's no error — this is the first thing to check if ads "just don't show up."

### Android

Enable the `ima` ExoPlayer extension in **gradle.properties**:

```properties title="android/gradle.properties"
RNVideo_useExoplayerIma=true
```

This pulls in `androidx.media3:media3-exoplayer-ima`, which in turn depends on `play-services-ads-identifier` — that transitively merges a `com.google.android.gms.permission.AD_ID` permission into your app's manifest, which is a Play Console Data Safety declaration. That's why this is opt-in rather than always-on.

Enabling it also requires **core library desugaring** in your app module, since the IMA SDK (≥ 3.38) declares it in its own AAR metadata:

```groovy title="android/app/build.gradle"
android {
  compileOptions {
    coreLibraryDesugaringEnabled true
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
}

dependencies {
  coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.5"
}
```

Skipping this step doesn't fail silently like the flag does — the build itself will fail once `RNVideo_useExoplayerIma=true` is set.

### iOS

Enable the flag in your **Podfile**, before `use_native_modules!`, then reinstall pods:

```ruby title="ios/Podfile"
$RNVideoUseGoogleIMA = true
```

```sh
cd ios && pod install
```

This links `GoogleAds-IMA-iOS-SDK` (`~> 3.33`), which requires iOS 15.0+ (already covered by this library's minimum supported iOS version).

:::info
There's no equivalent flag for visionOS or tvOS/Android TV yet — ads are Android and iOS only for now.
:::

## Quick start

Pass an `ads` config via `VideoConfig.ads` when creating a player. For a single, always-visible player (not a scrollable feed with multiple mounted players), set `autoActivate: true` so the ad is requested as soon as the player initializes:

```tsx
import { VideoView, useVideoPlayer } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer({
    source: { uri: 'https://example.com/video.m3u8' },
    ads: {
      adTagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?iu=...&output=vast',
      autoActivate: true,
    },
  });

  return <VideoView player={player} />;
}
```

## Ads config reference

Passed via `VideoConfig.ads` (`VideoAdsConfig`). All properties are optional except `adTagUrl`, which is required for the config to have any effect.

| Property | Type | Notes |
|---|---|---|
| `adTagUrl` | `string` | VAST or VMAP ad tag URL. Without this, the `ads` config is treated as absent. |
| `autoActivate` | `boolean` | When `true`, ads are requested as soon as the player initializes. When `false` (default), ads are only requested after an explicit `activateAds()` call. Use `false` for a scrollable feed where several players may be mounted/preloaded at once but only one is actually visible — otherwise every preloaded player would independently request an ad. |
| `language` | `string` | The language to request ads in (e.g. `'en'`, `'es'`). |
| `ppid` | `string` | A publisher-provided identifier for frequency capping / targeting. |
| `vastLoadTimeoutMs` | `number` | Timeout for the VAST ad tag request itself, passed to the IMA SDK. |
| `mediaLoadTimeoutMs` | `number` | Timeout for loading the ad media once an ad has been selected, passed to the IMA SDK. |
| `adRequestTimeoutMs` | `number` (default `8000`) | A fail-open watchdog independent of the two timeouts above: if no ad decision is reached within this time, the gate opens and content plays as if no ad was available. |

## Manual activation (feeds and other multi-player screens)

With `autoActivate` left at its default (`false`), nothing happens until you call `activateAds()` yourself — typically when a player becomes the active/visible one in a feed:

```tsx
useEffect(() => {
  if (isActiveInFeed) {
    player.activateAds().catch(() => {
      // Ad request/decision failures already fail open — content just
      // plays normally. Nothing to reconcile on your side.
    });
  } else {
    player.deactivateAds();
  }
}, [isActiveInFeed, player]);
```

- **`activateAds(): Promise<void>`** — activates the ad session configured via `ads` (a no-op if no `ads` config is present, or if already activated for the current source). Requests ads if not already requested, and resolves once the ad *decision* has been made (i.e. once it's known whether an ad will play) — not once ad playback finishes.
- **`deactivateAds(): void`** — tears down the current ad session, if any. Safe to call even when no session is active. Call this when a player stops being the active one (e.g. scrolls out of view in a feed) so it doesn't hold an ad session open, or request one, while invisible.
- **`skipAd(): void`** — skips the currently playing ad, if it's skippable and past its skip offset. A no-op otherwise.

## Ad state

- **`isPlayingAd: boolean`** (read-only) — whether an ad is currently playing.
- **`adState: VideoAdState`** (read-only) — the state of the native ad/playback gate:

| State | Meaning |
|---|---|
| `idle` | No ads are configured for the current source. |
| `activating` | Ads are configured but haven't been activated yet. |
| `requesting` | An ad request is in flight; content playback is gated. |
| `playing` | An ad is currently playing; content playback is gated. |
| `content` | The ad decision has resolved (with or without an ad played); content is allowed to play. |
| `failed` | The ad request/playback failed; content is allowed to play (fail-open). |

## Events

Subscribe with [`useEvent`](./events.md#using-the-useevent-hook), same as any other player event:

```tsx
useEvent(player, 'onAdStateChange', (state) => {
  console.log('Ad gate state:', state);
});
```

| Event | Callback Signature | Description |
|---|---|---|
| `onAdsResolved` | `(data: AdsResolvedEvent) => void` | Fired once the ad decision resolves — whether or not an ad will actually play. |
| `onAdBreakStart` | `(data: AdBreakEvent) => void` | Fired when an ad break (pre-roll/mid-roll/post-roll) starts. Content playback is gated until the matching `onAdBreakEnd`. |
| `onAdBreakEnd` | `(data: AdBreakEvent) => void` | Fired when an ad break ends and content playback is allowed to resume. |
| `onAdProgress` | `(data: AdProgressInfo) => void` | Fired periodically while an ad is playing. |
| `onAdStart` | `(data: AdInfo) => void` | Fired when the currently playing ad starts. |
| `onAdComplete` | `(data: AdInfo) => void` | Fired when the currently playing ad completes. |
| `onAdSkipped` | `(data: AdInfo) => void` | Fired when the currently playing ad is skipped via `skipAd()`. |
| `onAdClicked` | `() => void` | Fired when the user clicks/taps through an ad. |
| `onAdError` | `(data: AdErrorEvent) => void` | Fired on an ad request or ad playback error. If `fatal` is `true`, the ad break has ended and content playback will resume/start. |
| `onAllAdsCompleted` | `() => void` | Fired when all ad breaks for the current source have completed. |
| `onAdStateChange` | `(state: VideoAdState) => void` | Fired whenever `adState` changes. |

### Payload shapes

**`AdInfo`** (`onAdStart` / `onAdComplete` / `onAdSkipped`):

| Field | Type | Notes |
|---|---|---|
| `adId` | `string` | |
| `title` | `string?` | |
| `duration` | `number` | The ad's duration in seconds. `NaN` if unknown. |
| `skippable` | `boolean` | |
| `skipTimeOffset` | `number` | Time in seconds at which the ad becomes skippable. `-1` if not skippable. |
| `adPodIndex` | `number` | |
| `totalAdsInPod` | `number` | |
| `advertiserName` | `string?` | |

**`AdBreakEvent`** (`onAdBreakStart` / `onAdBreakEnd`): `{ kind: 'preRoll' | 'midRoll' | 'postRoll', totalAds: number }`

**`AdProgressInfo`** (`onAdProgress`): `{ currentTime: number, duration: number, adPodIndex: number, totalAdsInPod: number }`

**`AdsResolvedEvent`** (`onAdsResolved`): `{ hasAds: boolean, elapsedMs: number }` — `elapsedMs` is the time between activation and this decision resolving.

**`AdErrorEvent`** (`onAdError`): `{ code: number, message: string, fatal: boolean }`

## How it works

Ad playback is gated at the native playback layer, not with a JS-side check or timer — a content frame structurally cannot render before the ad decision resolves. On iOS, Picture-in-Picture is suppressed for the duration of an ad break and restored once it ends. Whatever the outcome of an ad request — an ad plays, no ad is available, or the request fails — content always plays: every ad failure path fails open.

## Troubleshooting

- **Ads never show up, no errors anywhere**: this is almost always the platform flag. Confirm `RNVideo_useExoplayerIma=true` in `android/gradle.properties` and/or `$RNVideoUseGoogleIMA = true` in your iOS `Podfile` (followed by a fresh `pod install`) — every ad API stays present but inert without them.
- **Android build fails after enabling `RNVideo_useExoplayerIma`**: add core library desugaring to your app module (see [Android setup](#android) above) — the IMA SDK's AAR metadata requires it.
- **`activateAds()` resolves but no ad plays**: check `onAdsResolved` — `hasAds: false` means the ad server had no fill for this request, which is a normal outcome, not a bug.
- **Every preloaded item in a feed requests its own ad**: set `autoActivate: false` (the default) and drive `activateAds()`/`deactivateAds()` yourself based on which item is actually active/visible.
- **Ad request seems to hang**: `adRequestTimeoutMs` (default `8000`) is the fail-open watchdog independent of `vastLoadTimeoutMs`/`mediaLoadTimeoutMs`; lower it if your feed needs a faster guaranteed fallback to content.
