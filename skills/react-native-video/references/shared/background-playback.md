# Background & lock-screen playback (v6 & v7)

The OS-level setup is the same; the JS surface differs.

## Native setup

- **iOS:** add `audio` to `UIBackgroundModes` in `Info.plist` (or via the Expo plugin). Required for audio to continue in the background.
- **Android:** background playback runs through a media service + notification; for Expo enable `enableBackgroundAudio` in the config plugin.

## JS

- **v7:** player properties `playInBackground`, `playWhenInactive` (iOS), and `showNotificationControls`; set `metadata` (`{ title, subtitle, artist, imageUri, ... }`) on the source for lock-screen info.
  ```tsx
  const player = useVideoPlayer(
    { uri, metadata: { title: 'Episode 1', artist: 'Acme' } },
    (player) => {                       // initial config in the setup callback (runs once)
      player.playInBackground = true;
      player.showNotificationControls = true;
    },
  );
  ```
- **v6:** props `playInBackground`, `playWhenInactive`, `showNotificationControls` on `<Video>` (use `disableFocus` to avoid grabbing audio focus).
  ```tsx
  <Video source={{ uri }} playInBackground playWhenInactive showNotificationControls />
  ```

> Test background audio on a real device; simulators behave differently. Web uses the browser MediaSession API.
