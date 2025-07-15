# Interface: VideoViewEvents

Defined in: [types/Events.ts:95](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L95)

## Properties

### onFullscreenChange()

```ts
onFullscreenChange: (fullscreen) => void;
```

Defined in: [types/Events.ts:105](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L105)

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

Defined in: [types/Events.ts:100](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L100)

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

Defined in: [types/Events.ts:109](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L109)

Called when the video view will enter fullscreen mode.

#### Returns

`void`

***

### willEnterPictureInPicture()

```ts
willEnterPictureInPicture: () => void;
```

Defined in: [types/Events.ts:117](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L117)

Called when the video view will enter picture in picture mode.

#### Returns

`void`

***

### willExitFullscreen()

```ts
willExitFullscreen: () => void;
```

Defined in: [types/Events.ts:113](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L113)

Called when the video view will exit fullscreen mode.

#### Returns

`void`

***

### willExitPictureInPicture()

```ts
willExitPictureInPicture: () => void;
```

Defined in: [types/Events.ts:121](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/types/Events.ts#L121)

Called when the video view will exit picture in picture mode.

#### Returns

`void`
