# Interface: VideoViewEvents

Defined in: [types/Events.ts:89](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L89)

## Properties

### onFullscreenChange()

```ts
onFullscreenChange: (fullscreen) => void;
```

Defined in: [types/Events.ts:99](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L99)

Called when the video view's fullscreen state changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fullscreen` | `boolean` | Whether the video view is in fullscreen mode. |

#### Returns

`void`

***

### onPictureInPictureChange()

```ts
onPictureInPictureChange: (isInPictureInPicture) => void;
```

Defined in: [types/Events.ts:94](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L94)

Called when the video view's picture in picture state changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `isInPictureInPicture` | `boolean` | Whether the video view is in picture in picture mode. |

#### Returns

`void`

***

### willEnterFullscreen()

```ts
willEnterFullscreen: () => void;
```

Defined in: [types/Events.ts:103](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L103)

Called when the video view will enter fullscreen mode.

#### Returns

`void`

***

### willEnterPictureInPicture()

```ts
willEnterPictureInPicture: () => void;
```

Defined in: [types/Events.ts:111](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L111)

Called when the video view will enter picture in picture mode.

#### Returns

`void`

***

### willExitFullscreen()

```ts
willExitFullscreen: () => void;
```

Defined in: [types/Events.ts:107](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L107)

Called when the video view will exit fullscreen mode.

#### Returns

`void`

***

### willExitPictureInPicture()

```ts
willExitPictureInPicture: () => void;
```

Defined in: [types/Events.ts:115](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L115)

Called when the video view will exit picture in picture mode.

#### Returns

`void`
