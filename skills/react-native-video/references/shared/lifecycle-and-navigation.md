# Lifecycle: video across navigation & app background (v6 & v7)

## How React Navigation treats screens

React Navigation does **not unmount** a screen when you navigate away — on a **stack** it stays fully mounted; on **tabs** it stays mounted but its native view is **detached/frozen** (`detachInactiveScreens`, default on). Detach ≠ unmount — your component and its state survive, so mount/unmount won't fire on navigate. Drive playback off **focus/blur** instead (`useFocusEffect` / `useIsFocused`).

## If audio keeps playing after you navigate away

Common on a **stack**. Pause on blur:

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// v7
useFocusEffect(useCallback(() => {
  player.play();
  return () => player.pause();   // runs on blur
}, [player]));
```

v6: bind the `paused` prop to focus — `const isFocused = useIsFocused(); <Video paused={!isFocused} />`.

## If the video instead stops / goes black / restarts when switching screens

Seen on **tab navigators + Android** with `detachInactiveScreens` (default): the native view is detached and Android may drop playback/position. Options: save the position and `seekTo` it on focus; keep that screen from detaching; or lift the player out of the screen (below).

## Keep a video alive across screens (mini / global player)

- Render the player **above the navigator** (app root / context) so no single screen owns it; or
- **v7:** create a `VideoPlayer` **class instance** outside any screen (e.g. a context/provider), pass it to whichever `VideoView` is mounted, and `release()` it on teardown. This is the "player outlives the component" case — see `../v7/player-model.md`.

## App backgrounded

By default the player **pauses when the app goes to the background** (`playInBackground` is `false`) — you don't need to wire this up yourself. If the media matters (a movie, a podcast, a call), keep it playing instead via **background audio** (`playInBackground` + `showNotificationControls`) or **Picture-in-Picture** — pick by use case. See `background-playback.md` and your version's `pip-fullscreen-controls`.

## One video *playing* at a time (feeds)

Several players can be alive at once — in a feed you'll keep a few around to preload neighbors — the rule is just that **only one plays**. There's no built-in exclusive playback, so track the active item in app state and pause the others. (v6 **Android**: `disableFocus` defaults to `false`, so a new video already pauses the previous via audio focus; `disableFocus={true}` lets them overlap. iOS: pause others manually. v7: `onAudioFocusChange` (Android) signals focus loss.)

> Pausing on blur (or in the screen's unmount cleanup) stops playback. **If audio ever keeps playing after the screen is gone**, pause/`release()` the player explicitly. Separately, whether the *video* stops/blacks/restarts on tab switches depends on navigator type, `detachInactiveScreens`, platform, and version — test your setup.
