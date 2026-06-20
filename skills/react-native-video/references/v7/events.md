# v7 — events

Events are **subscriptions on the player**, not JSX props. Two ways:

```tsx
// 1) hook — auto-removed on unmount
useEvent(player, 'onProgress', ({ currentTime }) => {});

// 2) imperative — returns { remove() }
const sub = player.addEventListener('onEnd', () => {});
// later: sub.remove();
```

## Player events + payloads

| Event | Payload | Notes |
|---|---|---|
| `onLoad` | `{ currentTime, duration, width, height, orientation }` | Metadata ready. |
| `onLoadStart` | `{ sourceType: 'local'\|'network', source }` | |
| `onProgress` | `{ currentTime, bufferDuration }` | Seconds. |
| `onPlaybackStateChange` | `{ isPlaying, isBuffering }` | |
| `onPlaybackRateChange` | `rate: number` | |
| `onBuffer` | `buffering: boolean` | |
| `onSeek` | `seekTime: number` | |
| `onVolumeChange` | `{ volume, muted }` | |
| `onEnd` | — | Reached the end. |
| `onReadyToDisplay` | — | First frame ready. |
| `onStatusChange` | `status: 'idle'\|'loading'\|'readyToPlay'\|'error'` | |
| `onError` | `error: VideoRuntimeError` | **JS-only:** if you subscribe, runtime errors are delivered here instead of thrown. Always handle it. |
| `onTimedMetadata` | `{ metadata: { value, identifier }[] }` | iOS/Android. |
| `onTextTrackDataChanged` | `string[]` | Currently displayed subtitle text. |
| `onTrackChange` | `TextTrack \| null` | Selected text track changed. |
| `onBandwidthUpdate` | `{ bitrate, width?, height? }` | |
| `onControlsVisibleChange` | `visible: boolean` | |
| `onAudioBecomingNoisy` | — | Android. |
| `onAudioFocusChange` | `hasAudioFocus: boolean` | Android. |
| `onExternalPlaybackChange` | `active: boolean` | iOS (AirPlay). |

## View events (on `<VideoView>` or its ref)

`onFullscreenChange(boolean)`, `onPictureInPictureChange(boolean)`, `willEnterFullscreen`, `willExitFullscreen`, `willEnterPictureInPicture`, `willExitPictureInPicture`. See `pip-fullscreen-controls.md`.

```tsx
<VideoView player={player} onFullscreenChange={(full) => {}} />
```

> Error handling: subscribing to `onError` switches v7 from "throw" to "callback" mode — wire it up so playback errors don't crash.
