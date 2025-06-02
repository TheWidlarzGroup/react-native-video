# Interface: VideoPlayerEvents

Defined in: [types/Events.ts:5](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L5)

## Properties

### onAudioBecomingNoisy()

```ts
onAudioBecomingNoisy: () => void;
```

Defined in: [types/Events.ts:10](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L10)

Called when the audio becomes noisy.

#### Returns

`void`

#### Platform

Android

***

### onAudioFocusChange()

```ts
onAudioFocusChange: (hasAudioFocus) => void;
```

Defined in: [types/Events.ts:16](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L16)

Called when the audio focus changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hasAudioFocus` | `boolean` | Whether the audio has focus. |

#### Returns

`void`

#### Platform

Android

***

### onBandwidthUpdate()

```ts
onBandwidthUpdate: (data) => void;
```

Defined in: [types/Events.ts:20](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L20)

Called when the bandwidth of the video changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`BandwidthData`](BandwidthData.md) |

#### Returns

`void`

***

### onBuffer()

```ts
onBuffer: (buffering) => void;
```

Defined in: [types/Events.ts:25](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L25)

Called when the video is buffering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `buffering` | `boolean` | Whether the video is buffering. |

#### Returns

`void`

***

### onControlsVisibleChange()

```ts
onControlsVisibleChange: (visible) => void;
```

Defined in: [types/Events.ts:30](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L30)

Called when the video view's controls visibility changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | Whether the video view's controls are visible. |

#### Returns

`void`

***

### onEnd()

```ts
onEnd: () => void;
```

Defined in: [types/Events.ts:34](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L34)

Called when the video ends.

#### Returns

`void`

***

### onExternalPlaybackChange()

```ts
onExternalPlaybackChange: (externalPlaybackActive) => void;
```

Defined in: [types/Events.ts:40](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L40)

Called when the external playback state changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `externalPlaybackActive` | `boolean` | Whether the external playback is active. |

#### Returns

`void`

#### Platform

iOS

***

### onLoad()

```ts
onLoad: (data) => void;
```

Defined in: [types/Events.ts:45](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L45)

Called when the video is loaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onLoadData`](onLoadData.md) |

#### Returns

`void`

#### Note

onLoadStart -> initialize the player -> onLoad

***

### onLoadStart()

```ts
onLoadStart: (data) => void;
```

Defined in: [types/Events.ts:50](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L50)

Called when the video starts loading.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onLoadStartData`](onLoadStartData.md) |

#### Returns

`void`

#### Note

onLoadStart -> initialize the player -> onLoad

***

### onPlaybackRateChange()

```ts
onPlaybackRateChange: (rate) => void;
```

Defined in: [types/Events.ts:58](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L58)

Called when the player playback rate changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rate` | `number` |

#### Returns

`void`

***

### onPlaybackStateChange()

```ts
onPlaybackStateChange: (data) => void;
```

Defined in: [types/Events.ts:54](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L54)

Called when the player playback state changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onPlaybackStateChangeData`](onPlaybackStateChangeData.md) |

#### Returns

`void`

***

### onProgress()

```ts
onProgress: (data) => void;
```

Defined in: [types/Events.ts:62](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L62)

Called when the player progress changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onProgressData`](onProgressData.md) |

#### Returns

`void`

***

### onReadyToDisplay()

```ts
onReadyToDisplay: () => void;
```

Defined in: [types/Events.ts:66](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L66)

Called when the video is ready to display.

#### Returns

`void`

***

### onSeek()

```ts
onSeek: (seekTime) => void;
```

Defined in: [types/Events.ts:70](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L70)

Called when the player seeks.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seekTime` | `number` |

#### Returns

`void`

***

### onStatusChange()

```ts
onStatusChange: (status) => void;
```

Defined in: [types/Events.ts:86](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L86)

Called when the player status changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`VideoPlayerStatus`](../type-aliases/VideoPlayerStatus.md) |

#### Returns

`void`

***

### onTextTrackDataChanged()

```ts
onTextTrackDataChanged: (texts) => void;
```

Defined in: [types/Events.ts:78](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L78)

Called when the text track (currently displayed subtitle) data changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string`[] |

#### Returns

`void`

***

### onTimedMetadata()

```ts
onTimedMetadata: (metadata) => void;
```

Defined in: [types/Events.ts:74](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L74)

Called when player receives timed metadata.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`TimedMetadata`](TimedMetadata.md) |

#### Returns

`void`

***

### onVolumeChange()

```ts
onVolumeChange: (volume) => void;
```

Defined in: [types/Events.ts:82](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/Events.ts#L82)

Called when the volume of the player changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `volume` | `number` |

#### Returns

`void`
