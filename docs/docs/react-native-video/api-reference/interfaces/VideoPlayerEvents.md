# Interface: VideoPlayerEvents

Defined in: [types/Events.ts:6](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L6)

## Properties

### onAudioBecomingNoisy()

```ts
onAudioBecomingNoisy: () => void;
```

Defined in: [types/Events.ts:11](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L11)

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

Defined in: [types/Events.ts:17](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L17)

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

Defined in: [types/Events.ts:21](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L21)

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

Defined in: [types/Events.ts:26](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L26)

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

Defined in: [types/Events.ts:31](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L31)

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

Defined in: [types/Events.ts:35](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L35)

Called when the video ends.

#### Returns

`void`

***

### onExternalPlaybackChange()

```ts
onExternalPlaybackChange: (externalPlaybackActive) => void;
```

Defined in: [types/Events.ts:41](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L41)

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

Defined in: [types/Events.ts:46](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L46)

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

Defined in: [types/Events.ts:51](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L51)

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

Defined in: [types/Events.ts:59](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L59)

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

Defined in: [types/Events.ts:55](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L55)

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

Defined in: [types/Events.ts:63](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L63)

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

Defined in: [types/Events.ts:67](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L67)

Called when the video is ready to display.

#### Returns

`void`

***

### onSeek()

```ts
onSeek: (seekTime) => void;
```

Defined in: [types/Events.ts:71](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L71)

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

Defined in: [types/Events.ts:92](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L92)

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

Defined in: [types/Events.ts:79](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L79)

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

Defined in: [types/Events.ts:75](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L75)

Called when player receives timed metadata.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`TimedMetadata`](TimedMetadata.md) |

#### Returns

`void`

***

### onTrackChange()

```ts
onTrackChange: (track) => void;
```

Defined in: [types/Events.ts:84](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L84)

Called when the selected text track changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `track` | `null` \| [`TextTrack`](TextTrack.md) | The newly selected text track, or null if no track is selected |

#### Returns

`void`

***

### onVolumeChange()

```ts
onVolumeChange: (volume) => void;
```

Defined in: [types/Events.ts:88](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/Events.ts#L88)

Called when the volume of the player changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `volume` | `number` |

#### Returns

`void`
