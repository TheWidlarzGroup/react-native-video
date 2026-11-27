---
title: VideoView Props — Controls, PiP & Resize Mode
sidebar_position: 2
sidebar_label: Props
description: Full reference of VideoView component props — player binding, controls, picture-in-picture, resize mode, and surface type options.
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
| `surfaceType` | `'surface' \| 'texture'` | No (Android only) | `'surface'` | (Android) Underlying native view type. `'surface'` uses a SurfaceView (better performance, no transforms/overlap), `'texture'` uses a TextureView (supports animations, transforms, overlapping UI) at a small performance cost. Ignored on iOS. |
| `poster` | `string \| VideoPoster` | No | - | An image shown over the video from the moment a source starts loading until the video is ready to display. Pass an image URL, or `Image` props with a `source`. See [Poster, loader and shutter](#poster-loader-and-shutter). |
| `posterResizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'center' \| 'repeat' \| 'none'` | No | `'contain'` | How the poster is resized to fit the view. `poster.resizeMode` wins when both are set. |
| `renderLoader` | `ReactNode \| (props) => ReactNode` | No | - | A custom view shown instead of the poster while the video loads. When set, `poster` is ignored. |
| `shutterColor` | `ColorValue` | No | - | The color that covers the video area until the video is ready to display. It sits under the poster or loader. |
| `hideShutterView` | `boolean` | No | `false` | Turns the shutter off, so `shutterColor` is ignored. |

## Poster, loader and shutter

`poster`, `renderLoader` and `shutterColor` cover the video from the moment a source starts loading until the player reports [`onReadyToDisplay`](../player/events.md). They come back when the player loads another source. For audio-only sources the cover stays, so a poster works as artwork. The cover follows the player, not the view: two views that show the same player uncover together, when the first frame appears in either of them.

```tsx
// An image URL
<VideoView player={player} poster="https://example.com/poster.jpg" posterResizeMode="cover" />

// A bundled image with Image props, on a black shutter
<VideoView
  player={player}
  poster={{ source: require('./poster.png'), resizeMode: 'contain' }}
  shutterColor="black"
/>

// Your own loader
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
