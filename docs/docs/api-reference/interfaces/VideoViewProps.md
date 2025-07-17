# Interface: VideoViewProps

Defined in: [video-view/VideoView.tsx:14](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L14)

## Extends

- `Partial`\<[`VideoViewEvents`](VideoViewEvents.md)\>.`ViewProps`

## Properties

### autoEnterPictureInPicture?

```ts
optional autoEnterPictureInPicture: boolean;
```

Defined in: [video-view/VideoView.tsx:34](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L34)

Whether to automatically enter picture in picture mode when the video is playing. Defaults to false.

***

### controls?

```ts
optional controls: boolean;
```

Defined in: [video-view/VideoView.tsx:26](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L26)

Whether to show the controls. Defaults to false.

***

### onFullscreenChange()?

```ts
optional onFullscreenChange: (fullscreen) => void;
```

Defined in: [types/Events.ts:105](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L105)

Called when the video view's fullscreen state changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fullscreen` | `boolean` | Whether the video view is in fullscreen mode. |

#### Returns

`void`

#### Inherited from

```ts
Partial.onFullscreenChange
```

***

### onPictureInPictureChange()?

```ts
optional onPictureInPictureChange: (isInPictureInPicture) => void;
```

Defined in: [types/Events.ts:100](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L100)

Called when the video view's picture in picture state changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `isInPictureInPicture` | `boolean` | Whether the video view is in picture in picture mode. |

#### Returns

`void`

#### Inherited from

```ts
Partial.onPictureInPictureChange
```

***

### pictureInPicture?

```ts
optional pictureInPicture: boolean;
```

Defined in: [video-view/VideoView.tsx:30](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L30)

Whether to enable & show the picture in picture button in native controls. Defaults to false.

***

### player

```ts
player: VideoPlayer;
```

Defined in: [video-view/VideoView.tsx:18](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L18)

The player to play the video - [VideoPlayer](../classes/VideoPlayer.md)

***

### resizeMode?

```ts
optional resizeMode: ResizeMode;
```

Defined in: [video-view/VideoView.tsx:42](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L42)

How the video should be resized to fit the view. Defaults to 'none'.
- 'contain': Scale the video uniformly (maintain aspect ratio) so that it fits entirely within the view
- 'cover': Scale the video uniformly (maintain aspect ratio) so that it fills the entire view (may crop)
- 'stretch': Scale the video to fill the entire view without maintaining aspect ratio
- 'none': Do not resize the video

***

### style?

```ts
optional style: ViewStyle;
```

Defined in: [video-view/VideoView.tsx:22](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/video-view/VideoView.tsx#L22)

The style of the video view - ViewStyle

#### Overrides

```ts
ViewProps.style
```

***

### willEnterFullscreen()?

```ts
optional willEnterFullscreen: () => void;
```

Defined in: [types/Events.ts:109](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L109)

Called when the video view will enter fullscreen mode.

#### Returns

`void`

#### Inherited from

```ts
Partial.willEnterFullscreen
```

***

### willEnterPictureInPicture()?

```ts
optional willEnterPictureInPicture: () => void;
```

Defined in: [types/Events.ts:117](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L117)

Called when the video view will enter picture in picture mode.

#### Returns

`void`

#### Inherited from

```ts
Partial.willEnterPictureInPicture
```

***

### willExitFullscreen()?

```ts
optional willExitFullscreen: () => void;
```

Defined in: [types/Events.ts:113](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L113)

Called when the video view will exit fullscreen mode.

#### Returns

`void`

#### Inherited from

```ts
Partial.willExitFullscreen
```

***

### willExitPictureInPicture()?

```ts
optional willExitPictureInPicture: () => void;
```

Defined in: [types/Events.ts:121](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/Events.ts#L121)

Called when the video view will exit picture in picture mode.

#### Returns

`void`

#### Inherited from

```ts
Partial.willExitPictureInPicture
```
