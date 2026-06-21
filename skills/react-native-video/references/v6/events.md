# v6 — events (callback props)

In v6, events are **callback props** on `<Video>` (not subscriptions like v7).

```tsx
<Video
  source={{ uri }}
  onLoad={({ duration, naturalSize }) => {}}
  onProgress={({ currentTime, playableDuration, seekableDuration }) => {}}
  onEnd={() => {}}
  onError={(e) => {}}
  onBuffer={({ isBuffering }) => {}}
/>
```

## Common events

| Prop | Fires when |
|---|---|
| `onLoadStart` / `onLoad` | Load begins / metadata ready. |
| `onProgress` | Playback progress (throttle with `progressUpdateInterval`). |
| `onSeek` | Seek completes. |
| `onEnd` | Reached the end. |
| `onError` | Playback error. |
| `onBuffer` | Buffering state changes. |
| `onReadyForDisplay` | First frame ready. |
| `onPlaybackStateChanged` | Playing/paused changes. |
| `onPlaybackRateChange` | Rate changes. |
| `onVolumeChange` | Volume/mute changes. |
| `onAudioTracks` / `onTextTracks` / `onVideoTracks` | Available tracks reported. |
| `onTimedMetadata` | In-stream metadata. |
| `onBandwidthUpdate` | Needs `reportBandwidth`. |
| `onControlsVisibilityChange` | Native controls show/hide. |
| `onExternalPlaybackChange` | AirPlay/external. |
| `onPictureInPictureStatusChanged` | PiP enter/exit. |
| `onReceiveAdEvent` | IMA ad events (v6 only). |
| `onFullscreenPlayerWillPresent` / `DidPresent` / `WillDismiss` / `DidDismiss` | Fullscreen lifecycle. |

> The full event list is at https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/events/.

> **Retry on error:** on `onError`, `ref.setSource(...)` or remount with backoff; on Android, `disableDisconnectError` keeps buffering through brief network loss.

> **v7 note:** event *names and shapes differ* and they're delivered via `useEvent`/`player.addEventListener`, not props (e.g. v6 `onPlaybackStateChanged` → v7 `onPlaybackStateChange`). See `../v7/events.md` and `../migration-v6-to-v7.md`.
