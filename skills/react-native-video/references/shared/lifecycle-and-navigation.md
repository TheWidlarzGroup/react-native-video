# Lifecycle: pausing on navigation & app background (v6 & v7)

**Neither version auto-pauses when you navigate away.** React Navigation keeps screens *mounted* (just hidden) when you push another screen, so the video keeps playing — and you keep hearing audio — until you handle it yourself. The v7 `useVideoPlayer` hook only releases on a real **unmount**, not on blur. This is the single most common react-native-video bug.

## Pause when the screen loses focus (React Navigation)

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// v7 — pause on blur, resume on focus
useFocusEffect(useCallback(() => {
  player.play();
  return () => player.pause();
}, [player]));
```

v6: drive the `paused` prop from focus — `const isFocused = useIsFocused(); <Video paused={!isFocused} />`.

## Pause when the app is backgrounded

```tsx
import { AppState } from 'react-native';
import { useEffect } from 'react';

useEffect(() => {
  const sub = AppState.addEventListener('change', (s) => {
    if (s !== 'active') player.pause();   // v6: set paused = true
  });
  return () => sub.remove();
}, [player]);
```

> **Decide by use case — don't reflexively stop content the user cares about.** Pausing on background is a sensible *default*, but if the video matters (a movie, a podcast/lecture, a meeting) it shouldn't just stop when the user leaves the app — keep it going via **Picture-in-Picture** (`autoEnterPictureInPicture`) or **play-in-background** (`playInBackground` + `showNotificationControls`). For incidental/decorative video, pausing on exit is fine. Pick PiP vs background by the use case. See your version's `pip-fullscreen-controls` + `background-playback.md`.

## Only one video playing at a time (feeds)

There's no built-in exclusive playback — track the active item in app state and pause the others.

- **v6 Android:** `disableFocus` defaults to `false`, so starting a new video already pauses the previous one via audio focus; set `disableFocus={true}` to let them overlap.
- **iOS:** no audio-focus equivalent — pause the others manually.
- **v7:** `onAudioFocusChange` (Android) lets you react to focus loss.
