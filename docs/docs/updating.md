---
title: Migration Guide — Upgrading from v6 to v7
sidebar_label: Updating
description: Upgrade React Native Video from v6 to v7 — every v6 prop, event and ref method mapped to the useVideoPlayer + VideoView API, the behavior changes to watch for, and what v7 does not have yet.
sidebar_class_name: hidden
keywords: [updating, migration, upgrade guide, breaking changes, v6 to v7, AI migration, Claude Code, Cursor, agent skill, react native video]
---

# Updating

## Upgrading from react-native-video v6 to v7

Version 7 splits the v6 `<Video>` component in two:

*   **`VideoPlayer`** owns playback. It is an object, not a component, and you usually create it with the **`useVideoPlayer`** hook.
*   **`VideoView`** renders a player on the screen.

A player exists without a view, so you can create and preload it before anything is on screen.

This page maps the whole v6 API to v7 and lists what v7 does not have yet. It describes `7.0.0-beta.15`, and notes what changes in the release after `7.0.0-beta.15`.

:::tip Migrate faster with an AI assistant
Our agent skill knows the v6→v7 mapping. Install it with `npx skills add TheWidlarzGroup/react-native-video` and let your editor rewrite `Video` calls into the `useVideoPlayer` + `VideoView` model. See [Build with AI](./build-with-ai/overview.mdx).
:::

### Before you start

*   Read [Not in v7 yet](#not-in-v7-yet) first. Subtitle styling is in an open pull request. Start position and trimming, caching, the loading and buffering options, the poster props, `controlsStyles`, the fullscreen orientation props, audio output and secure output, and `progressUpdateInterval` come with the release after `7.0.0-beta.15`. Ads and TV platforms are planned after v7 stable. A few v6 props are removed for good. v6 is still maintained, so you can stay on it until the feature you need lands.
*   v7 needs React Native 0.75 or newer and iOS 15 or newer. See [Installation](./fundamentals/installation.md) for all requirements.
*   Time values keep the units of v6. Positions and lengths are in seconds: `player.currentTime`, `player.duration`, `seekTo()`, `seekBy()`, and the times in `onProgress`, `onLoad` and `onSeek`. Options are in milliseconds: `bufferConfig`, and `startPosition`, `cropStart` and `cropEnd`, from the release after `7.0.0-beta.15`. The one exception is `preferredForwardBufferDuration`, which was in seconds in v6 and is `bufferConfig.preferredForwardBufferDurationMs` in v7.

### 1. Install

```bash
npm install react-native-video@beta react-native-nitro-modules
```

v7 is built on [Nitro Modules](https://nitro.margelo.com/docs/what-is-nitro), so `react-native-nitro-modules` is a required dependency. While v7 is in beta it is published under the `beta` tag, and `latest` is still v6.

Then install the pods:

```bash
cd ios && pod install
```

In an Expo project run `npx expo prebuild` instead. If you use the Expo config plugin or set build flags by hand, see [Build configuration](#build-configuration).

### 2. Replace the component

**v6**

```tsx
import { useRef } from 'react';
import Video, { type VideoRef } from 'react-native-video';

const Player = () => {
  const videoRef = useRef<VideoRef>(null);

  return (
    <Video
      ref={videoRef}
      source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
      style={{ width: 300, height: 200 }}
      controls
      repeat
      onLoad={(data) => console.log('Loaded', data.duration)}
      onProgress={(data) => console.log('Progress', data.currentTime)}
    />
  );
};
```

**v7**

```tsx
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';

const Player = () => {
  const player = useVideoPlayer(
    { uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    (_player) => {
      _player.loop = true;
      _player.play();
    }
  );

  useEvent(player, 'onLoad', (data) => console.log('Loaded', data.duration));
  useEvent(player, 'onProgress', (data) =>
    console.log('Progress', data.currentTime)
  );

  return (
    <VideoView player={player} style={{ width: 300, height: 200 }} controls />
  );
};
```

### 3. Check the behavior changes

| | v6 | v7 |
| :--- | :--- | :--- |
| Starting playback | The video plays as soon as it loads, unless `paused` is set. | The player stays paused until you call `player.play()`. |
| Changing the source | Change the `source` prop. | `useVideoPlayer` creates a new player when its source argument changes. To keep the same player, call `player.replaceSourceAsync(source)`. |
| Lifetime | The player lives as long as the component is mounted. | `useVideoPlayer` releases the player when the component unmounts. A player made with `new VideoPlayer(source)` lives until you call `player.release()`. |
| Event payloads | Always an object, such as `{ isBuffering }`. | Often a plain value, such as a `boolean`. See [Events](#events). |
| Buffer on Android | ExoPlayer's defaults: `minBufferMs` and `maxBufferMs` are both `50000`. | `minBufferMs` is `5000` and `maxBufferMs` is `10000`. Set [`bufferConfig`](./player/use-video-player.md#buffer-config) if you relied on the larger buffer. |
| Audio focus on Android | Playback takes audio focus when it starts, so other apps pause. `disableFocus` turns this off. | Up to `7.0.0-beta.15` the player does not take audio focus: other apps keep playing next to the video, and they do not pause it. From the release after `7.0.0-beta.15` it takes focus when playback starts. With the default `mixAudioMode: 'auto'` other apps lower their volume, with `'doNotMix'` they pause as in v6, and `'mixWithOthers'` does not take focus. See [Audio](./player/video-player.md#audio). |
| Status after an error or the end on Android | `onIdle` fires after a playback error. | Up to `7.0.0-beta.15` the status goes to `'error'` and a moment later to `'idle'`, and to `'idle'` at the end. From the release after `7.0.0-beta.15` it stays `'error'` after a failure and `'readyToPlay'` after the end, as on iOS. Detect a failure with `onError` and the end with `onEnd`, not with `'idle'`. |

### Props

The props of `<Video>` now live in three places: on the player, in the config passed to `useVideoPlayer`, and on `VideoView`.

#### Playback props are on the player

Set them in the setup callback of `useVideoPlayer`, or at any later time.

| v6 prop | v7 | Notes |
| :--- | :--- | :--- |
| `paused` | `player.play()` and `player.pause()` | Read the state from `player.isPlaying` or the `onPlaybackStateChange` event. |
| `muted` | `player.muted` | |
| `volume` | `player.volume` | |
| `rate` | `player.rate` | |
| `repeat` | `player.loop` | |
| `ignoreSilentSwitch` | `player.ignoreSilentSwitchMode` | iOS. `'inherit'` is now `'auto'`. `'ignore'` and `'obey'` are unchanged. |
| `mixWithOthers` | `player.mixAudioMode` | `'inherit'` is now `'auto'`, `'mix'` is `'mixWithOthers'` and `'duck'` is `'duckOthers'`. `'doNotMix'` is new. |
| `disableFocus` | `player.mixAudioMode = 'mixWithOthers'` | Android. In this mode the player does not request audio focus. |
| `playInBackground` | `player.playInBackground` | |
| `playWhenInactive` | `player.playWhenInactive` | iOS. |
| `showNotificationControls` | `player.showNotificationControls` | |
| `audioOutput` | `player.audioOutput` | From the release after `7.0.0-beta.15`. `'speaker'` (default) or `'earpiece'`. On Android `'earpiece'` needs the `MODIFY_AUDIO_SETTINGS` permission. See [VideoPlayer](./player/video-player.md). |
| `allowsExternalPlayback` | `player.allowsExternalPlayback` | iOS. From the release after `7.0.0-beta.15`. |
| `progressUpdateInterval` | `player.progressUpdateInterval` | From the release after `7.0.0-beta.15`. Milliseconds, as in v6. The default stays 250 ms on Android and web and 500 ms on iOS, where v6 used 250 ms. On web the browser decides how often `timeupdate` fires, so the value can only make the events rarer. |
| `disableAudioSessionManagement` | `player.disableAudioSessionManagement` | iOS. The exported `setAudioSessionManagementDisabled(true)` turns it off globally. |
| `selectedTextTrack` | `player.selectTextTrack(track)` | Pick the track from `player.getAvailableTextTracks()`. Pass `null` to turn subtitles off. |
| `selectedAudioTrack` | `player.selectAudioTrack(trackId)` | From `7.0.0-beta.15`. Pick the id from `player.getAvailableAudioTracks()` instead of a `{ type, value }` object. Pass `undefined` for the default track. `player.selectedAudioTrackId` and `onAudioTrackChange` report the selection. Ids can differ between sources. See [Audio tracks](./player/audio-tracks.md). |
| `selectedVideoTrack` | `player.selectVideoTrack(trackId)` | From `7.0.0-beta.15`. Pick the id from `player.getAvailableVideoTracks()`. Pass `undefined` for automatic quality. `onVideoTrackChange` reports what is playing. See [Video quality](./player/video-quality.md). |
| `reportBandwidth` | Not needed | `onBandwidthUpdate` is always emitted. |

See [Player](./player/player.md) for the full reference.

#### Source props are in the `useVideoPlayer` config

The first argument of `useVideoPlayer` is a URL, a `require()` asset or a config object. The config object has `uri` at the top level. There is no `source` key.

| v6 | v7 | Notes |
| :--- | :--- | :--- |
| `source={{ uri }}` | `useVideoPlayer({ uri })` or `useVideoPlayer(uri)` | |
| `source={require('./video.mp4')}` | `useVideoPlayer(require('./video.mp4'))` | Not supported on web. |
| `source.headers` | `headers` | |
| `source.metadata` | `metadata` | Same fields: `title`, `subtitle`, `description`, `artist`, `imageUri`. |
| `textTracks`, `source.textTracks` | `externalSubtitles` | `title` is now `label`. `type` is `'vtt'`, `'srt'`, `'ssa'` or `'ass'` instead of a MIME type, and you can leave it out when the URL ends with that extension. iOS plays only WebVTT. TTML is not supported. |
| `drm`, `source.drm` | `drm` | Needs the DRM plugin. See [DRM](#drm). |
| `bufferConfig`, `source.bufferConfig` | `bufferConfig` | See the next table. |
| `maxBitRate` | `bufferConfig.preferredPeakBitRate` | Bits per second, as in v6. |
| `preferredForwardBufferDuration` | `bufferConfig.preferredForwardBufferDurationMs` | iOS. Seconds in v6, milliseconds in v7. |
| `source.startPosition` | `startPosition` | From the release after `7.0.0-beta.15`. Milliseconds, as in v6. Also on web. |
| `source.cropStart`, `source.cropEnd` | `cropStart`, `cropEnd` | From the release after `7.0.0-beta.15`. Milliseconds, as in v6. iOS and Android. The player treats the cropped part as the whole video. |
| `source.shouldCache` | `shouldCache` | From the release after `7.0.0-beta.15`. iOS and Android, up to 100 MB. Progressive files only: HLS, DASH, DRM content and sources with `externalSubtitles` play without the cache. |
| `minLoadRetryCount`, `disableDisconnectError` | Same names, in the config | From the release after `7.0.0-beta.15`. Android. |
| `source.type`, `source.textTracksAllowChunklessPreparation`, `source.cmcd` | `type`, `textTracksAllowChunklessPreparation`, `cmcd` | From the release after `7.0.0-beta.15`. Android. |
| `automaticallyWaitsToMinimizeStalling` | `bufferConfig.automaticallyWaitsToMinimizeStalling` | From the release after `7.0.0-beta.15`. iOS. |

| v6 `bufferConfig` | v7 `bufferConfig` |
| :--- | :--- |
| `minBufferMs`, `maxBufferMs`, `bufferForPlaybackMs`, `bufferForPlaybackAfterRebufferMs`, `backBufferDurationMs` | Same names. Android. |
| `live` | `livePlayback`, with the same five fields. |
| `bufferingStrategy`, `maxHeapAllocationPercent`, `minBufferMemoryReservePercent` | Same names, from the release after `7.0.0-beta.15`. Android. |
| `minBackBufferMemoryReservePercent`, `initialBitrate`, `cacheSizeMB` | Not available. |

#### View props are on `VideoView`

| v6 prop | v7 `VideoView` prop | Notes |
| :--- | :--- | :--- |
| `style`, `testID` and other view props | Same | |
| `controls` | `controls` | |
| `resizeMode` | `resizeMode` | Same values: `'none'`, `'contain'`, `'cover'`, `'stretch'`. |
| `enterPictureInPictureOnLeave` | `autoEnterPictureInPicture` | |
| `preventsDisplaySleepDuringVideoPlayback` | `keepScreenAwake` | Still `true` by default. |
| `viewType`, `useTextureView` | `surfaceType` | Android. `'surface'` (default) or `'texture'`. `ViewType.SURFACE_SECURE` and `useSecureView` are `'secureSurface'` from the release after `7.0.0-beta.15`. |
| `fullscreen` | `enterFullscreen()` and `exitFullscreen()` on the view ref | See [Ref methods](#ref-methods). |
| `fullscreenOrientation`, `fullscreenAutorotate` | Same names | From the release after `7.0.0-beta.15`, on iOS and Android. v6 had them on iOS only. |
| `poster`, `posterResizeMode`, `renderLoader`, `shutterColor`, `hideShutterView` | Same names | From the release after `7.0.0-beta.15`, on all platforms. With one of them set when the view mounts, `style` goes to a wrapper view. See [Poster, loader and shutter](./video-view/props.md#poster-loader-and-shutter). |
| `controlsStyles` | `controlsStyles` | Android. From the release after `7.0.0-beta.15`. See [Android: Customizing the controls](./video-view/props.md#android-customizing-the-controls). |

`pictureInPicture` is new. It shows the Picture-in-Picture button in the native controls.

See [VideoView props](./video-view/props.md) for the full reference.

### Events

Player events are no longer props. Subscribe with the `useEvent` hook, which removes the listener for you, or with `player.addEventListener(name, callback)`, which returns a subscription with a `remove()` method.

```tsx
useEvent(player, 'onBuffer', (isBuffering) => setLoading(isBuffering));
useEvent(player, 'onError', (error) => console.error(error.code, error.message));
```

| v6 event | v7 player event | What changed |
| :--- | :--- | :--- |
| `onLoadStart` | `onLoadStart` | `{ isNetwork, type, uri }` is now `{ sourceType, source }`. `sourceType` is `'local'` or `'network'`. |
| `onLoad` | `onLoad` | `width`, `height` and `orientation` moved from `naturalSize` to the top level. `audioTracks`, `textTracks` and `videoTracks` are no longer in the payload. |
| `onReadyForDisplay` | `onReadyToDisplay` | From the release after `7.0.0-beta.15` once per source on Android. On iOS once per source and view. See [Player events](./player/events.md). |
| `onProgress` | `onProgress` | `{ currentTime, playableDuration, seekableDuration }` is now `{ currentTime, bufferDuration }`. See the note below. |
| `onBuffer` | `onBuffer` | `{ isBuffering }` is now a `boolean`. |
| `onPlaybackStateChanged` | `onPlaybackStateChange` | `{ isPlaying, isSeeking }` is now `{ isPlaying, isBuffering }`. |
| `onPlaybackRateChange` | `onPlaybackRateChange` | `{ playbackRate }` is now a `number`. |
| `onVolumeChange` | `onVolumeChange` | `{ volume }` is now `{ volume, muted }`. |
| `onSeek` | `onSeek` | `{ currentTime, seekTime }` is now a `number`: the position the player moved to. |
| `onEnd` | `onEnd` | |
| `onError` | `onError` | `{ error }` is now a `VideoRuntimeError` with a `code`, such as `'player/playback-failed'`, and a `message`. |
| `onIdle` | `onStatusChange` | Called with `'idle'`, `'loading'`, `'readyToPlay'` or `'error'`. `'idle'` means that no source is loaded. Up to `7.0.0-beta.15` on Android `'idle'` also comes after an error and at the end; see [Check the behavior changes](#3-check-the-behavior-changes). On web `'idle'` comes at the end. |
| `onBandwidthUpdate` | `onBandwidthUpdate` | `trackId` is gone. Android and iOS. |
| `onTimedMetadata` | `onTimedMetadata` | Unchanged. |
| `onTextTrackDataChanged` | `onTextTrackDataChanged` | `{ subtitleTracks }` is now a `string[]`. |
| `onAudioTracks` | `onAudioTrackChange` | `{ audioTracks }` is now `{ availableTracks, selectedTrackId }`. It also fires when the selected track changes. |
| `onTextTracks` | None | Read the list with `player.getAvailableTextTracks()`. The new `onTrackChange` event reports the selected text track. |
| `onAudioBecomingNoisy` | `onAudioBecomingNoisy` | Android only in v7. |
| `onAudioFocusChanged` | `onAudioFocusChange` | `{ hasAudioFocus }` is now a `boolean`. Android. Not emitted yet: the type exists, but the event does not fire. |
| `onExternalPlaybackChange` | `onExternalPlaybackChange` | `{ isExternalPlaybackActive }` is now a `boolean`. iOS. |

:::info onProgress in v7
*   **Interval.** Set `player.progressUpdateInterval`, in milliseconds, from the release after `7.0.0-beta.15`. Without it the event fires every 250 ms on Android and every 500 ms on iOS, where v6 used 250 ms. On web it follows the browser's `timeupdate` event.
*   **Duration.** `seekableDuration` is gone. Read `player.duration`.
*   **Buffer.** v6 `playableDuration` was the position the buffer reaches. `bufferDuration` is the number of seconds buffered ahead of the current position, so the v6 value is `currentTime + bufferDuration`. On iOS this holds from `7.0.0-beta.15`; earlier betas report the position the buffer reaches (see [#5028](https://github.com/TheWidlarzGroup/react-native-video/issues/5028)).
*   **Status and buffering on iOS.** Up to `7.0.0-beta.14` the player did not report status and buffering changes that come from playback stalls. From `7.0.0-beta.15` `onBuffer`, `onStatusChange` and `isBuffering` in `onPlaybackStateChange` fire for them.
:::

Fullscreen and Picture-in-Picture events are props of `VideoView`:

| v6 event | v7 `VideoView` event | What changed |
| :--- | :--- | :--- |
| `onFullscreenPlayerWillPresent` | `willEnterFullscreen` | |
| `onFullscreenPlayerDidPresent` | `onFullscreenChange` | Called with `true`. |
| `onFullscreenPlayerWillDismiss` | `willExitFullscreen` | |
| `onFullscreenPlayerDidDismiss` | `onFullscreenChange` | Called with `false`. |
| `onPictureInPictureStatusChanged` | `onPictureInPictureChange` | `{ isActive }` is now a `boolean`. `willEnterPictureInPicture` and `willExitPictureInPicture` are new. |
| `onRestoreUserInterfaceForPictureInPictureStop` | Not needed | v7 completes the restore natively. |

See [Player events](./player/events.md) and [VideoView events](./video-view/events.md) for the full reference.

### Ref methods

The methods of `videoRef.current` are divided between the player and a ref to `VideoView`.

```tsx
import { useRef } from 'react';
import { VideoView, type VideoViewRef } from 'react-native-video';

const viewRef = useRef<VideoViewRef>(null);

<VideoView ref={viewRef} player={player} />;
```

| v6 `videoRef.current` | v7 | Notes |
| :--- | :--- | :--- |
| `seek(time, tolerance)` | `player.seekTo(time)` | Seconds. `player.seekBy(seconds)` seeks relative to the current position. There is no tolerance argument. |
| `pause()` | `player.pause()` | |
| `resume()` | `player.play()` | |
| `setVolume(volume)` | `player.volume = volume` | |
| `getCurrentPosition()` | `player.currentTime` | A synchronous property, not a promise. |
| `setSource(source)` | `player.replaceSourceAsync(source)` | Passing `null` unloads the source. On iOS and Android it also releases the player. |
| `presentFullscreenPlayer()`, `setFullScreen(true)` | `viewRef.current.enterFullscreen()` | |
| `dismissFullscreenPlayer()`, `setFullScreen(false)` | `viewRef.current.exitFullscreen()` | |
| `enterPictureInPicture()` | `viewRef.current.enterPictureInPicture()` | `canEnterPictureInPicture()` tells you whether it is available. |
| `exitPictureInPicture()` | `viewRef.current.exitPictureInPicture()` | |
| `restoreUserInterfaceForPictureInPictureStopCompleted()` | Not needed | |
| `save()` | Not yet | |
| `nativeHtmlVideoRef` (web) | `player.nativeHtmlVideoElement` | From the release after `7.0.0-beta.15`. The `<video>` element of the web player, there as soon as the player exists. |

See [VideoView methods](./video-view/methods.md) for the full reference.

### DRM

DRM is no longer part of the core package. Install the plugin and enable it once, before you create the first player:

```bash
npm install @react-native-video/drm@beta
```

```ts
import { enable } from '@react-native-video/drm';

enable();
```

Then pass `drm` in the player config. Several fields were renamed:

| v6 `drm` | v7 `drm` | Notes |
| :--- | :--- | :--- |
| `type: DRMType.WIDEVINE` | `type: 'widevine'` | A string instead of an enum. Optional: the default is Widevine on Android and FairPlay on iOS. |
| `licenseServer` | `licenseUrl` | |
| `headers` | `licenseHeaders` | Android. On iOS the `headers` of the source are sent with the license request. |
| `multiDrm` | `multiSession` | Android. |
| `certificateUrl`, `contentId` | Same | iOS. |
| `getLicense(spcBase64, contentId, licenseUrl, loadedLicenseUrl)` | `getLicense({ contentId, licenseUrl, keyUrl, spc })` | iOS. One object argument. Return the CKC as a base64 string. |
| `base64Certificate`, `localSourceEncryptionKeyScheme` | Not yet | |

See [DRM](./player/drm.md) for the full reference.

### Build configuration

Options of the Expo config plugin:

| v6 option | v7 option |
| :--- | :--- |
| `enableNotificationControls` | `enableAndroidPlaybackService`, on by default |
| `enableAndroidPictureInPicture` | Same |
| `enableBackgroundAudio` | Same |
| `androidExtensions.useExoplayerDash`, `androidExtensions.useExoplayerHls` | Same |
| `androidExtensions.useExoplayerRtsp`, `androidExtensions.useExoplayerSmoothStreaming` | Not available |
| `enableADSExtension`, `enableCacheExtension` | Not available |

See [With Expo](./fundamentals/configuration/with-expo.md).

Without Expo, the v6 Podfile flags `$RNVideoUseGoogleIMA` and `$RNVideoUseVideoCaching` are gone, and so are the Gradle flags `useExoplayerIMA`, `useExoplayerRtsp` and `useExoplayerSmoothStreaming`. DASH and HLS on Android are now switched with `RNVideo_useExoplayerDash` and `RNVideo_useExoplayerHls` in `gradle.properties`. See [Without Expo](./fundamentals/configuration/without-expo.md).

### Not in v7 yet

This is the state after `7.0.0-beta.15`, with what comes in the release after `7.0.0-beta.15`. v7 runs on iOS, Android and web.

#### In open pull requests

This v6 feature is in an open pull request and is planned before v7 stable:

| Feature | v6 API | v7 API | Pull request |
| :--- | :--- | :--- | :--- |
| Subtitle styling | `subtitleStyle` | `subtitleStyle` on `VideoView` | [#5149](https://github.com/TheWidlarzGroup/react-native-video/pull/5149) |

#### Being worked on

These have no pull request yet, but work on them has started:

| Area | v6 API |
| :--- | :--- |
| Content start time | `contentStartTime` (Android, DASH with server-side ads) |

#### Planned after v7 stable

These are in open pull requests and are planned for after the stable release:

| Feature | v6 API | Pull request |
| :--- | :--- | :--- |
| Ads (Google IMA) | `adTagUrl`, `adLanguage`, `source.ad`, `onReceiveAdEvent` | [#5136](https://github.com/TheWidlarzGroup/react-native-video/pull/5136) |
| tvOS and Android TV | `focusable`, the tvOS target | [#5150](https://github.com/TheWidlarzGroup/react-native-video/pull/5150) |

If your app needs ads or TV platforms, stay on v6 for now.

#### Planned, no date yet

| Area | v6 API | Notes |
| :--- | :--- | :--- |
| Seeking | the `tolerance` argument of `seek`, `seekableDuration` in `onProgress`, `isSeeking` in `onPlaybackStateChanged` | Read `player.duration` instead of `seekableDuration`. |
| Stream types | RTSP and SmoothStreaming on Android | |
| Controls | `onControlsVisibilityChange` | `onControlsVisibleChange` is in the types but is not emitted yet. |
| Audio | `onAudioBecomingNoisy` on iOS | |
| Decoder info | `VideoDecoderProperties.getWidevineLevel`, `isCodecSupported`, `isHEVCSupported` | |
| Saving and local encryption | `save()`, `currentPlaybackTime`, `localSourceEncryptionKeyScheme`, `drm.base64Certificate` | |

#### Removed

These will not come back in v7:

| v6 API | Why | Instead |
| :--- | :--- | :--- |
| `debug`, `filter`, `filterEnabled` | Removed | |
| `chapters` | It worked on tvOS only in v6 | The [Chapters](./video-view/chapters.md) plugin |
| `onRestoreUserInterfaceForPictureInPictureStop`, `restoreUserInterfaceForPictureInPictureStopCompleted()` | Not needed | v7 restores the interface natively |
| `onAspectRatio` | Not needed | `onLoad` reports `width`, `height` and `orientation` |
| visionOS and Windows | Not supported in v7 | Stay on v6 |

The source fields `isNetwork`, `isAsset`, `isLocalAssetFile`, `mainVer` and `patchVer` are gone as well.
