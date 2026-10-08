# v7 — ads (Google IMA, client-side)

v7 plays pre-roll, mid-roll and post-roll ads (VAST/VMAP tags) with Google's IMA SDK on **Android and iOS**. No web, visionOS or tvOS yet. Client-side insertion only (no SSAI). Playback is gated natively: no content frame renders before the ad decision, and every failure path (no fill, timeout, error) falls back to content.

## Setup — the platform flag is REQUIRED

Ads are **opt-in and off by default**. Without the flag every ad API exists but silently does nothing (no error, no events). First thing to check when "ads never show".

- **Android** — `android/gradle.properties`: `RNVideo_useExoplayerIma=true` (example app uses `useExoplayerIma=true`), plus core library desugaring in the app module (`coreLibraryDesugaringEnabled true` and `coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.5"`). Merges the `AD_ID` permission (Play Data Safety declaration).
- **iOS** — `ios/Podfile`, before `use_native_modules!`: `$RNVideoUseGoogleIMA = true`, then `pod install`.

Rebuild the native app after changing a flag.

## Use

```tsx
const player = useVideoPlayer({
  uri: 'https://example.com/master.m3u8',
  ads: { adTagUrl: 'https://…&output=vast', autoActivate: true },
});
return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} />;
```

- `ads.adTagUrl` (required for the config to count), `autoActivate` (**default `false`**), `language`, `ppid`, `vastLoadTimeoutMs`, `mediaLoadTimeoutMs`, `adRequestTimeoutMs` (default 8000, fail-open watchdog).
- `autoActivate: true` for a single player. In a feed keep it `false` and call `player.activateAds()` when the item becomes active and `player.deactivateAds()` when it stops (otherwise every preloaded player requests an ad).
- `player.skipAd()` skips a skippable ad past its skip offset. `player.isPlayingAd` and `player.adState` (`idle | activating | requesting | playing | content | failed`) are read-only.
- Swapping with `replaceSourceAsync(source)` starts a fresh ad session for a source that has `ads`; a source without `ads` ends it.

## Events — prefer `onAdEvent`

One listener for everything, `{ type, data }`:

```tsx
useEvent(player, 'onAdEvent', ({ type, data }) => {
  switch (type) {
    case 'adStart': /* data: AdInfo */ break;
    case 'adError': /* data: { code, message, fatal } */ break;
    case 'adStateChange': /* data: VideoAdState */ break;
  }
});
```

`type` is one of `adsResolved`, `adBreakStart`, `adBreakEnd`, `adProgress`, `adStart`, `adComplete`, `adSkipped`, `adClicked`, `adError`, `allAdsCompleted`, `adStateChange` (`data` is `undefined` for `adClicked` and `allAdsCompleted`). The same events also exist individually: `onAdsResolved`, `onAdBreakStart`, `onAdBreakEnd`, `onAdProgress`, `onAdStart`, `onAdComplete`, `onAdSkipped`, `onAdClicked`, `onAdError`, `onAllAdsCompleted`, `onAdStateChange`.

Payloads: `AdInfo { adId, title?, duration, skippable, skipTimeOffset, adPodIndex, totalAdsInPod, advertiserName? }` — `adPodIndex` is the **zero-based** position in the pod (show `adPodIndex + 1` of `totalAdsInPod`); `AdBreakEvent { kind: 'preRoll'|'midRoll'|'postRoll', totalAds }`; `AdProgressInfo { currentTime, duration, adPodIndex, totalAdsInPod }`; `AdsResolvedEvent { hasAds, elapsedMs }`. `hasAds: false` is a normal "no fill", not a bug.

## Limitations (tell the user)

- Keep the `VideoView` mounted and visible while ads run; the ad UI is drawn inside it. On iOS, with no visible view the request fails open after `adRequestTimeoutMs` ("No ad decision within 8000ms").
- **Android: don't use `surfaceType="texture"` with ads** — the ad stalls (frozen frame, no progress). Use the default surface. Known, not fixed.
- Ads take a moment to appear (an Android pre-roll took ~4–5 s in testing); content is withheld until the decision. Lower `adRequestTimeoutMs` for a faster fallback.
- iOS fullscreen during an ad: drive it with `VideoView.enterFullscreen()` / `exitFullscreen()` (AVKit's own controls are hidden while an ad plays). Fullscreen follows the phone's rotation if the app's `Info.plist` allows landscape. iOS Picture-in-Picture is suppressed during an ad break.
- Don't put your own tappable views over the ad UI (skip button, "Learn more").
- Google's public sample tags are not always filled (skippable and VMAP post-roll were unreliable) — an empty result is the ad server, not the player.

## Testing with Google's sample tags

Base `https://pubads.g.doubleclick.net/gampad/ads`. Single pre-roll: `?iu=/21775744923/external/single_ad_samples&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&cust_params=sample_ct%3Dlinear&correlator=`. VMAP: `?iu=/21775744923/external/vmap_ad_samples&sz=640x480&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&cust_params=sample_ar%3Dpreonly&correlator=` (`preonly`, `postonly`, `premidpost`, `premidpostpod`; `short_onecue` puts the mid-roll at 15 s). Full docs: `docs/docs/player/ads.md`.
