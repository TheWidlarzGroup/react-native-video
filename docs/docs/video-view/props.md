---
title: VideoView Props — Controls, PiP & Resize Mode
sidebar_position: 2
sidebar_label: Props
description: Full reference of VideoView component props — player binding, controls, picture-in-picture, resize mode, surface type and Android controls options.
keywords: [VideoView props, player, controls, resizeMode, surfaceType, picture-in-picture, react native video]
---

# Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `player` | `VideoPlayer` | Yes | - | The `VideoPlayer` instance that manages the video to be displayed. |
| `style` | `ViewStyle` | No | - | Standard React Native styles to control the layout and appearance of the `VideoView`. |
| `controls` | `boolean` | No | `false` | Whether to show the native video playback controls (play/pause, seek bar, volume, etc.). |
| `pictureInPicture` | `boolean` | No | `false` | Whether to enable and show the picture-in-picture (PiP) button in the native controls (if supported by the platform and controls are visible). |
| `autoEnterPictureInPicture` | `boolean` | No | `false` | Whether the video should automatically enter PiP mode when it starts playing and the app is backgrounded (behavior might vary by platform). |
| `resizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'none'` | No | `'none'` | How the video should be resized to fit the view. |
| `keepScreenAwake` | `boolean` | No | `true` | Whether to keep the device screen awake while the video view is mounted. |
| `surfaceType` | `'surface' \| 'texture' \| 'secureSurface'` | No (Android only) | `'surface'` | (Android) Underlying native view type. `'surface'` uses a SurfaceView (better performance, no transforms/overlap), `'texture'` uses a TextureView (supports animations, transforms, overlapping UI) at a small performance cost, `'secureSurface'` uses a SurfaceView that is left out of screenshots and screen recordings. Ignored on iOS and web. |
| `fullscreenOrientation` | `'all' \| 'landscape' \| 'portrait'` | No (iOS, Android) | `'all'` | Orientation of native fullscreen. `'landscape'` and `'portrait'` open fullscreen in that orientation, whichever way the device is held. On iOS the app has to support the orientation, and the prop has no effect on an iPad app that supports multitasking. On Android the activity is turned while fullscreen is open; on Android 16 and newer, an app that targets API level 36 is not turned on a large screen (smallest width of 600 dp or more). |
| `fullscreenAutorotate` | `boolean` | No (iOS, Android) | `true` | With `true`, fullscreen opens in `fullscreenOrientation` and follows the device once the user has turned it there. With `false`, fullscreen stays locked to `fullscreenOrientation`. Ignored when `fullscreenOrientation` is `'all'`. On Android fullscreen follows the device only while auto-rotate is on in the system settings. |
| `controlsStyles` | `ControlsStyles` | No (Android only) | - | (Android) Hides single elements of the native controls and chooses which system bars fullscreen hides. See [Android: Customizing the controls](#android-customizing-the-controls). Ignored on iOS and web. |
| `poster` | `string \| VideoPoster` | No | - | An image shown over the video from the moment a source starts loading until the video is ready to display. Pass an image URL, or `Image` props with a `source`. See [Poster, loader and shutter](#poster-loader-and-shutter). |
| `posterResizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'center' \| 'repeat' \| 'none'` | No | `'contain'` | How the poster is resized to fit the view. `poster.resizeMode` wins when both are set. |
| `renderLoader` | `ReactNode \| (props) => ReactNode` | No | - | A custom view shown instead of the poster while the video loads. When set, `poster` is ignored. |
| `shutterColor` | `ColorValue` | No | - | The color that covers the video area until the video is ready to display. It sits under the poster or loader. |
| `hideShutterView` | `boolean` | No | `false` | Turns the shutter off, so `shutterColor` is ignored. |

## Poster, loader and shutter

`poster`, `renderLoader` and `shutterColor` cover the video from the moment a source starts loading until the player reports [`onReadyToDisplay`](../player/events.md). They come back when the player loads another source. For audio-only sources the cover stays on iOS and Android, so a poster works as artwork; on web it goes away once the audio has loaded. The cover follows the player, not the view: two views that show the same player uncover together, when the first frame appears in either of them.

An image URL:

```tsx
<VideoView player={player} poster="https://example.com/poster.jpg" posterResizeMode="cover" />
```

A bundled image with `Image` props, on a black shutter:

```tsx
<VideoView
  player={player}
  poster={{ source: require('./poster.png'), resizeMode: 'contain' }}
  shutterColor="black"
/>
```

Your own loader:

```tsx
<VideoView
  player={player}
  renderLoader={
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  }
/>
```

`renderLoader` also takes a function. It receives `{ style, resizeMode }`: a style that fills the video view and the resolved poster resize mode.

:::note
The cover is a React Native view drawn above the video, and it doesn't receive touches. Adding or removing these props on a mounted view never recreates the native view.

When a view is mounted with one of these props, `VideoView` renders the native view inside a wrapper `View` that takes the `style` and `onLayout`. When they are first set after the view is mounted (a poster URL that arrives later), the cover is placed over the video's measured frame instead, so it follows layout changes but not transforms or opacity set in `style`. Set `shutterColor` or `poster` on the first render if you animate the view.
:::

## Android: Choosing a surface type

:::info Android Only
This section applies only to Android. The `surfaceType` prop is ignored on iOS.
:::

On Android the default rendering path uses a `SurfaceView` (set via `surfaceType="surface"`) for optimal decoding performance and lower latency. However `SurfaceView` lives in a separate window and can't be:

- Animated with transforms (scale, rotate, opacity fade)
- Clipped by parent views (rounded corners, masks)
- Overlapped reliably with sibling views (z-order issues)

If you need those UI effects, switch to `TextureView`:

```tsx
<VideoView
  player={player}
  surfaceType="texture"
  style={{ width: 300, height: 170, borderRadius: 16, overflow: 'hidden' }}
  resizeMode="cover"
  controls
/>
```

Use `TextureView` only when required, as it can be slightly less performant and may increase power consumption on some devices.

To keep the video out of screenshots, screen recordings and non-secure external displays, use a secure surface. This replaces the v6 `useSecureView` prop:

```tsx
<VideoView player={player} surfaceType="secureSurface" style={{ width: 300, height: 170 }} />
```

A secure surface is a `SurfaceView`, so it has the same limits as `'surface'`. It hides only the video, not the rest of the screen.

## Android: Customizing the controls

:::info Android Only
This section applies only to Android. The `controlsStyles` prop is ignored on iOS and web.
:::

`controlsStyles` hides single elements of the native controls. It needs `controls` to be enabled. Every field is optional.

```tsx
<VideoView
  player={player}
  controls
  controlsStyles={{
    hideForward: true,
    hideRewind: true,
    hideSettingButton: true,
    hideNavigationBarOnFullScreenMode: false,
  }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
/>
```

| Field | Default | Description |
|-------|---------|-------------|
| `hideSeekBar` | `false` | Hides the seek bar. |
| `hidePosition` | `false` | Hides the current position label. |
| `hideDuration` | `false` | Hides the duration label. |
| `hidePlayPause` | `false` | Hides the play/pause button. |
| `hideForward` | `false` | Hides the fast-forward button. |
| `hideRewind` | `false` | Hides the rewind button. |
| `hideNext` | `false` | Hides the "next" button. |
| `hidePrevious` | `false` | Hides the "previous" button. |
| `hideFullscreen` | `false` | Hides the button that enters fullscreen. You can still call `enterFullscreen()` on the view ref, and the button that leaves fullscreen is always shown. |
| `hideSettingButton` | `false` | Hides the settings button (playback speed and tracks). |
| `hideNavigationBarOnFullScreenMode` | `true` | Hides the system navigation bar in fullscreen. |
| `hideNotificationBarOnFullScreenMode` | `true` | Hides the system status bar in fullscreen. |

:::note Coming from v6
v6 had the same prop. Two defaults differ: v6 hid the settings button unless you set `hideSettingButton: false`, and v7 shows it. `seekIncrementMS`, `liveLabel` and `hideLiveBadge` are not available: the v7 controls have no live badge, and the seek increment is not configurable yet.
:::
