---
sidebar_position: 3
sidebar_label: events
description: VideoView event callbacks
---

# Events

`VideoView` also accepts several event callback props related to UI state changes:

| Event | Type | Description |
|-------|------|-------------|
| `onPictureInPictureChange?` | `(event: { isActive: boolean }) => void` | Fired when the picture-in-picture mode starts or stops. |
| `onFullscreenChange?` | `(event: { isFullscreen: boolean }) => void` | Fired when the fullscreen mode starts or stops. |
| `willEnterFullscreen?` | `() => void` | Fired just before the view enters fullscreen mode. |
| `willExitFullscreen?` | `() => void` | Fired just before the view exits fullscreen mode. |
| `willEnterPictureInPicture?` | `() => void` | Fired just before the view enters picture-in-picture mode. |
| `willExitPictureInPicture?` | `() => void` | Fired just before the view exits picture-in-picture mode. |

These can be used to update your component's state or UI in response to these changes.

```tsx
<VideoView
  player={player}
  onFullscreenChange={({ isFullscreen }) => {
    console.log(isFullscreen ? 'Entered fullscreen' : 'Exited fullscreen');
  }}
  onPictureInPictureChange={({ isActive }) => {
    console.log(isActive ? 'PiP active' : 'PiP inactive');
  }}
/>
```
