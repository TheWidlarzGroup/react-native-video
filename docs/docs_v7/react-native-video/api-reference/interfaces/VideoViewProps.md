# Interface: VideoViewProps

Defined in: video-view/VideoView.tsx:13

## Extends

- `Partial`\<[`VideoViewEvents`](VideoViewEvents.md)\>

## Properties

### autoEnterPictureInPicture?

```ts
optional autoEnterPictureInPicture: boolean;
```

Defined in: video-view/VideoView.tsx:33

Whether to automatically enter picture in picture mode when the video is playing. Defaults to false.

***

### controls?

```ts
optional controls: boolean;
```

Defined in: video-view/VideoView.tsx:25

Whether to show the controls. Defaults to false.

***

### onFullscreenChange()?

```ts
optional onFullscreenChange: (fullscreen) => void;
```

Defined in: [types/Events.ts:99](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L99)

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

Defined in: [types/Events.ts:94](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L94)

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

Defined in: video-view/VideoView.tsx:29

Whether to enable & show the picture in picture button in native controls. Defaults to false.

***

### player

```ts
player: VideoPlayer;
```

Defined in: video-view/VideoView.tsx:17

The player to play the video - [VideoPlayer](../classes/VideoPlayer.md)

***

### style?

```ts
optional style: ViewStyle;
```

Defined in: video-view/VideoView.tsx:21

The style of the video view - ViewStyle

***

### willEnterFullscreen()?

```ts
optional willEnterFullscreen: () => void;
```

Defined in: [types/Events.ts:103](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L103)

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

Defined in: [types/Events.ts:111](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L111)

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

Defined in: [types/Events.ts:107](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L107)

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

Defined in: [types/Events.ts:115](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L115)

Called when the video view will exit picture in picture mode.

#### Returns

`void`

#### Inherited from

```ts
Partial.willExitPictureInPicture
```
