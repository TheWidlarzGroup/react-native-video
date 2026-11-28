---
title: Errors
sidebar_position: 7
sidebar_label: Errors
description: Every error code react-native-video v7 reports, where it comes from, and how to handle it in the player and in VideoView.
keywords: [errors, error codes, onError, VideoRuntimeError, VideoComponentError, react native video]
---

# Errors

Every error from the library has a `code` (for example `player/playback-failed`) and a `message`. The `code` is the stable part: compare it, not the message. The `message` describes the case, and for `player/playback-failed` it carries the platform's own error code and description.

There are two kinds of errors:

| Error | Where it comes from | Codes |
|-------|---------------------|-------|
| `VideoRuntimeError` | The player: the `onError` event, synchronous player methods, and rejected promises of `initialize()`, `preload()` and `replaceSourceAsync()`. | `library/*`, `player/*`, `source/*`, `web/*`, `unknown/unknown` |
| `VideoComponentError` | `VideoView` ref methods such as `enterFullscreen()` and `enterPictureInPicture()`, which throw synchronously. | `view/*` |

`VideoRuntimeError` and `VideoComponentError` are exported as types only, so check `error.code` rather than `instanceof`.

## Handling player errors

Subscribe to `onError`, with the [`useEvent`](./events.md#using-the-useevent-hook) hook in a component or `player.addEventListener('onError', …)` elsewhere. With an `onError` listener attached, synchronous methods such as `play()` or `seekTo()` report to it instead of throwing. Without one, they throw. The rules for promises and cancelled loads are in [VideoPlayer: Error Handling](./video-player.md#error-handling).

```tsx
import { useState } from 'react';
import { Text } from 'react-native';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';

export function Player() {
  const player = useVideoPlayer('https://example.com/video.mp4');
  const [problem, setProblem] = useState<string | null>(null);

  useEvent(player, 'onError', (error) => {
    switch (error.code) {
      case 'player/playback-failed':
        // The stream failed after loading started: HTTP 404, network loss, decoder error.
        setProblem(`Playback failed: ${error.message}`);
        break;
      case 'source/file-does-not-exist':
      case 'source/invalid-uri':
        setProblem('This video is not available.');
        break;
      default:
        setProblem(error.code);
    }
  });

  return (
    <>
      <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} />
      {problem ? <Text>{problem}</Text> : null}
    </>
  );
}
```

## Handling view errors

`VideoView` ref methods throw a `VideoComponentError` synchronously, so wrap them in `try`/`catch`:

```tsx
import { useRef } from 'react';
import { Button } from 'react-native';
import { useVideoPlayer, VideoView, type VideoViewRef } from 'react-native-video';

export function PictureInPictureButton() {
  const player = useVideoPlayer('https://example.com/video.mp4');
  const view = useRef<VideoViewRef>(null);

  const startPictureInPicture = () => {
    try {
      view.current?.enterPictureInPicture();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'view/picture-in-picture-not-supported') {
        console.log('Picture in picture is not available on this device');
      }
    }
  };

  return (
    <>
      <VideoView ref={view} player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} />
      <Button title="Picture in picture" onPress={startPictureInPicture} />
    </>
  );
}
```

## Error codes

| Code | Platforms | When |
|------|-----------|------|
| `library/deallocated` | iOS, Android | A native object was used after it was released. |
| `library/application-context-not-found` | Android | The library could not get the Android application context. |
| `library/drm-plugin-not-found` | iOS, Android | A source with `drm` was loaded, but no DRM plugin is enabled. See [DRM](./drm.md). |
| `player/released` | iOS, Android | The player was used after `release()`. |
| `player/not-initialized` | iOS, Android | A method needs the native player, which does not exist (yet). |
| `player/asset-not-initialized` | iOS, Android | A method needs the media item, which was not created, for example with `initializeOnCreation: false` before `initialize()`. |
| `player/invalid-source` | iOS, Android | The source passed to the player is not valid. |
| `player/invalid-track-url` | iOS | The `uri` of an entry in `externalSubtitles` is not a valid URL. |
| `player/playback-failed` | iOS, Android | The native player failed after loading started (HTTP 404, network loss, decoder failure). `message` holds the ExoPlayer `errorCodeName` on Android, or the `NSError` domain, code and description on iOS. Delivered through `onError`, together with `onStatusChange('error')`. |
| `player/cancelled` | iOS, Android | A load did not finish: a newer `initialize()`, `preload()` or `replaceSourceAsync()` replaced it (not reported to `onError`), or the native player had been released (reported). |
| `source/invalid-uri` | iOS, Android | The `uri` cannot be parsed. |
| `source/photo-library-asset-not-found` | iOS | A photo library (`ph://`) asset does not exist. |
| `source/missing-read-file-permission` | iOS, Android | The app may not read the local file. |
| `source/file-does-not-exist` | iOS, Android | There is no file at the local `uri`. |
| `source/failed-to-initialize-asset` | iOS, Android | The media item could not be created from the source. |
| `source/unsupported-content-type` | iOS, Android | The type of the content is not supported. |
| `source/cancelled` | iOS, Android | Loading the source was cancelled, as for `player/cancelled`. |
| `view/not-found` | iOS, Android | The native view of a `VideoView` was not found, usually because it was unmounted. |
| `view/deallocated` | iOS, Android | A ref method was called after the view was released. |
| `view/picture-in-picture-not-supported` | iOS, Android | The device or app does not support picture in picture. |
| `web/aborted` | web | The browser aborted loading. |
| `web/network` | web | A network error stopped loading. |
| `web/decode` | web | The browser could not decode the media. |
| `web/unsupported-source` | web | The browser does not support the source. |
| `unknown/unknown` | iOS, Android, web | The platform reported a failure without a known cause. |
