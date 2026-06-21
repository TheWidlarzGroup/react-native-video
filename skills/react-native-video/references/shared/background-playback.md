# Background & lock-screen playback (v6 & v7)

The OS-level setup is the same; the JS surface differs.

## Native setup

- **iOS:** add `audio` to `UIBackgroundModes` in `Info.plist` (or via the Expo plugin). Required for audio to continue in the background.
- **Android:** background playback runs through a media service + notification; for Expo enable `enableBackgroundAudio` in the config plugin.

## What each option does

- **`playInBackground`** — keep playing when the app is sent to the **background** (home / app switcher).
- **`playWhenInactive`** (iOS) — keep playing while the app is **inactive but still on screen** (Notification/Control Center pulled over the video, incoming-call banner).
- **`showNotificationControls`** — show media controls on the **lock screen / notification shade**; set `metadata` (`{ title, subtitle, artist, imageUri, ... }`) on the source for the title/artwork shown there.
- **`disableFocus`** (v6) — don't grab audio focus, so other apps' audio isn't paused.

## v7

```tsx
const player = useVideoPlayer(
  { uri, metadata: { title: 'Episode 1', artist: 'Acme' } },
  (player) => {                       // initial config in the setup callback (runs once)
    player.playInBackground = true;
    player.playWhenInactive = true;   // iOS
    player.showNotificationControls = true;
  },
);
```

## v6

```tsx
<Video source={{ uri }} playInBackground playWhenInactive showNotificationControls />
```

> **Background vs Picture-in-Picture:** the options above keep the **audio** going while the app is backgrounded. To keep the **video** visible after the user leaves the screen/app, use **Picture-in-Picture** (often used alongside background audio) — see `../v7/pip-fullscreen-controls.md` / `../v6/pip-fullscreen-controls.md` and `lifecycle-and-navigation.md`.

> Verify iOS background audio on a **real device** — the iOS Simulator doesn't model `AVAudioSession` background behavior reliably (it can fail where a device works, and pass where a device wouldn't). The Android emulator is reliable for this.

> Web uses the browser MediaSession API for lock-screen controls.
