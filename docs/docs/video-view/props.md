---
sidebar_position: 2
sidebar_label: props
description: VideoView component properties
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
