# Class: VideoPlayer

Defined in: [VideoPlayer.ts:20](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L20)

## Extends

- `VideoPlayerEvents`

## Implements

- `VideoPlayerBase`

## Constructors

### Constructor

```ts
new VideoPlayer(source): VideoPlayer;
```

Defined in: [VideoPlayer.ts:25](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L25)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | \| [`VideoSource`](../type-aliases/VideoSource.md) \| [`VideoConfig`](../type-aliases/VideoConfig.md) \| `VideoPlayerSource` |

#### Returns

`VideoPlayer`

#### Overrides

```ts
VideoPlayerEvents.constructor
```

## Properties

### onError()?

```ts
optional onError: (error) => void = undefined;
```

Defined in: [VideoPlayer.ts:23](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L23)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`VideoRuntimeError`](VideoRuntimeError.md) |

#### Returns

`void`

## Accessors

### currentTime

#### Get Signature

```ts
get currentTime(): number;
```

Defined in: [VideoPlayer.ts:109](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L109)

The duration of the video in seconds (1.0 = 1 sec).
Returns NaN if the duration is not available.

##### Returns

`number`

#### Set Signature

```ts
set currentTime(value): void;
```

Defined in: [VideoPlayer.ts:113](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L113)

The duration of the video in seconds (1.0 = 1 sec).
Returns NaN if the duration is not available.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.currentTime
```

***

### duration

#### Get Signature

```ts
get duration(): number;
```

Defined in: [VideoPlayer.ts:95](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L95)

The current time of the video in seconds (1.0 = 1 sec).
Returns NaN if the current time is not available.

##### Returns

`number`

#### Implementation of

```ts
VideoPlayerBase.duration
```

***

### ignoreSilentSwitchMode

#### Get Signature

```ts
get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode;
```

Defined in: [VideoPlayer.ts:154](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L154)

Controls the silent switch mode of the player.

##### Note

This is only supported on iOS.

- `auto` - uses default behavior for player.
- `ignore` - ignore the silent switch.
- `obey` - obey the silent switch.

##### Returns

[`IgnoreSilentSwitchMode`](../type-aliases/IgnoreSilentSwitchMode.md)

#### Set Signature

```ts
set ignoreSilentSwitchMode(value): void;
```

Defined in: [VideoPlayer.ts:158](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L158)

Controls the silent switch mode of the player.

##### Note

This is only supported on iOS.

- `auto` - uses default behavior for player.
- `ignore` - ignore the silent switch.
- `obey` - obey the silent switch.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`IgnoreSilentSwitchMode`](../type-aliases/IgnoreSilentSwitchMode.md) |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.ignoreSilentSwitchMode
```

***

### isPlaying

#### Get Signature

```ts
get isPlaying(): boolean;
```

Defined in: [VideoPlayer.ts:187](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L187)

Whether the player is playing.

##### Note

This is a read-only property.

##### Note

To pause/resume the player, you need to use [play](#play) and [pause](#pause) methods.

##### Returns

`boolean`

#### Implementation of

```ts
VideoPlayerBase.isPlaying
```

***

### loop

#### Get Signature

```ts
get loop(): boolean;
```

Defined in: [VideoPlayer.ts:127](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L127)

Whether the player is looped.

##### Returns

`boolean`

#### Set Signature

```ts
set loop(value): void;
```

Defined in: [VideoPlayer.ts:131](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L131)

Whether the player is looped.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.loop
```

***

### mixAudioMode

#### Get Signature

```ts
get mixAudioMode(): MixAudioMode;
```

Defined in: [VideoPlayer.ts:145](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L145)

Controls the audio mixing mode of the player.

- `mixWithOthers` - Mix with other players.
- `doNotMix` - Do not mix with other players.
- `duckOthers` - Duck other players.
- `auto` - uses default behavior for player.

default is `auto`.

##### Returns

[`MixAudioMode`](../type-aliases/MixAudioMode.md)

#### Set Signature

```ts
set mixAudioMode(value): void;
```

Defined in: [VideoPlayer.ts:149](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L149)

Controls the audio mixing mode of the player.

- `mixWithOthers` - Mix with other players.
- `doNotMix` - Do not mix with other players.
- `duckOthers` - Duck other players.
- `auto` - uses default behavior for player.

default is `auto`.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`MixAudioMode`](../type-aliases/MixAudioMode.md) |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.mixAudioMode
```

***

### muted

#### Get Signature

```ts
get muted(): boolean;
```

Defined in: [VideoPlayer.ts:118](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L118)

Whether the player is muted.

##### Returns

`boolean`

#### Set Signature

```ts
set muted(value): void;
```

Defined in: [VideoPlayer.ts:122](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L122)

Whether the player is muted.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.muted
```

***

### onAudioBecomingNoisy

#### Get Signature

```ts
get onAudioBecomingNoisy(): () => void;
```

Defined in: [VideoPlayerEvents.ts:58](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L58)

Called when the audio becomes noisy.

##### Platform

Android

##### Returns

```ts
(): void;
```

###### Returns

`void`

#### Set Signature

```ts
set onAudioBecomingNoisy(value): void;
```

Defined in: [VideoPlayerEvents.ts:52](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L52)

Called when the audio becomes noisy.

##### Platform

Android

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | () => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onAudioBecomingNoisy
```

***

### onAudioFocusChange

#### Get Signature

```ts
get onAudioFocusChange(): (hasAudioFocus) => void;
```

Defined in: [VideoPlayerEvents.ts:68](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L68)

Called when the audio focus changes.

##### Platform

Android

##### Returns

```ts
(hasAudioFocus): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `hasAudioFocus` | `boolean` |

###### Returns

`void`

#### Set Signature

```ts
set onAudioFocusChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:62](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L62)

Called when the audio focus changes.

##### Platform

Android

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`hasAudioFocus`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onAudioFocusChange
```

***

### onBandwidthUpdate

#### Get Signature

```ts
get onBandwidthUpdate(): (data) => void;
```

Defined in: [VideoPlayerEvents.ts:78](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L78)

Called when the bandwidth of the video changes.

##### Returns

```ts
(data): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`BandwidthData`](../interfaces/BandwidthData.md) |

###### Returns

`void`

#### Set Signature

```ts
set onBandwidthUpdate(value): void;
```

Defined in: [VideoPlayerEvents.ts:72](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L72)

Called when the bandwidth of the video changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`data`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onBandwidthUpdate
```

***

### onBuffer

#### Get Signature

```ts
get onBuffer(): (buffering) => void;
```

Defined in: [VideoPlayerEvents.ts:86](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L86)

Called when the video is buffering.

##### Returns

```ts
(buffering): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `buffering` | `boolean` |

###### Returns

`void`

#### Set Signature

```ts
set onBuffer(value): void;
```

Defined in: [VideoPlayerEvents.ts:82](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L82)

Called when the video is buffering.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`buffering`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onBuffer
```

***

### onControlsVisibleChange

#### Get Signature

```ts
get onControlsVisibleChange(): (visible) => void;
```

Defined in: [VideoPlayerEvents.ts:96](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L96)

Called when the video view's controls visibility changes.

##### Returns

```ts
(visible): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `visible` | `boolean` |

###### Returns

`void`

#### Set Signature

```ts
set onControlsVisibleChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:90](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L90)

Called when the video view's controls visibility changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`visible`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onControlsVisibleChange
```

***

### onEnd

#### Get Signature

```ts
get onEnd(): () => void;
```

Defined in: [VideoPlayerEvents.ts:104](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L104)

Called when the video ends.

##### Returns

```ts
(): void;
```

###### Returns

`void`

#### Set Signature

```ts
set onEnd(value): void;
```

Defined in: [VideoPlayerEvents.ts:100](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L100)

Called when the video ends.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | () => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onEnd
```

***

### onExternalPlaybackChange

#### Get Signature

```ts
get onExternalPlaybackChange(): (externalPlaybackActive) => void;
```

Defined in: [VideoPlayerEvents.ts:114](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L114)

Called when the external playback state changes.

##### Platform

iOS

##### Returns

```ts
(externalPlaybackActive): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `externalPlaybackActive` | `boolean` |

###### Returns

`void`

#### Set Signature

```ts
set onExternalPlaybackChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:108](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L108)

Called when the external playback state changes.

##### Platform

iOS

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`externalPlaybackActive`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onExternalPlaybackChange
```

***

### onLoad

#### Get Signature

```ts
get onLoad(): (data) => void;
```

Defined in: [VideoPlayerEvents.ts:122](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L122)

Called when the video is loaded.

##### Note

onLoadStart -> initialize the player -> onLoad

##### Returns

```ts
(data): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onLoadData`](../interfaces/onLoadData.md) |

###### Returns

`void`

#### Set Signature

```ts
set onLoad(value): void;
```

Defined in: [VideoPlayerEvents.ts:118](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L118)

Called when the video is loaded.

##### Note

onLoadStart -> initialize the player -> onLoad

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`data`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onLoad
```

***

### onLoadStart

#### Get Signature

```ts
get onLoadStart(): (data) => void;
```

Defined in: [VideoPlayerEvents.ts:130](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L130)

Called when the video starts loading.

##### Note

onLoadStart -> initialize the player -> onLoad

##### Returns

```ts
(data): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onLoadStartData`](../interfaces/onLoadStartData.md) |

###### Returns

`void`

#### Set Signature

```ts
set onLoadStart(value): void;
```

Defined in: [VideoPlayerEvents.ts:126](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L126)

Called when the video starts loading.

##### Note

onLoadStart -> initialize the player -> onLoad

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`data`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onLoadStart
```

***

### onPlaybackRateChange

#### Get Signature

```ts
get onPlaybackRateChange(): (rate) => void;
```

Defined in: [VideoPlayerEvents.ts:150](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L150)

Called when the player playback rate changes.

##### Returns

```ts
(rate): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `rate` | `number` |

###### Returns

`void`

#### Set Signature

```ts
set onPlaybackRateChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:144](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L144)

Called when the player playback rate changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`rate`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onPlaybackRateChange
```

***

### onPlaybackStateChange

#### Get Signature

```ts
get onPlaybackStateChange(): (data) => void;
```

Defined in: [VideoPlayerEvents.ts:140](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L140)

Called when the player playback state changes.

##### Returns

```ts
(data): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onPlaybackStateChangeData`](../interfaces/onPlaybackStateChangeData.md) |

###### Returns

`void`

#### Set Signature

```ts
set onPlaybackStateChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:134](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L134)

Called when the player playback state changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`data`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onPlaybackStateChange
```

***

### onProgress

#### Get Signature

```ts
get onProgress(): (data) => void;
```

Defined in: [VideoPlayerEvents.ts:158](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L158)

Called when the player progress changes.

##### Returns

```ts
(data): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`onProgressData`](../interfaces/onProgressData.md) |

###### Returns

`void`

#### Set Signature

```ts
set onProgress(value): void;
```

Defined in: [VideoPlayerEvents.ts:154](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L154)

Called when the player progress changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`data`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onProgress
```

***

### onReadyToDisplay

#### Get Signature

```ts
get onReadyToDisplay(): () => void;
```

Defined in: [VideoPlayerEvents.ts:166](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L166)

Called when the video is ready to display.

##### Returns

```ts
(): void;
```

###### Returns

`void`

#### Set Signature

```ts
set onReadyToDisplay(value): void;
```

Defined in: [VideoPlayerEvents.ts:162](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L162)

Called when the video is ready to display.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | () => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onReadyToDisplay
```

***

### onSeek

#### Get Signature

```ts
get onSeek(): (seekTime) => void;
```

Defined in: [VideoPlayerEvents.ts:174](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L174)

Called when the player seeks.

##### Returns

```ts
(seekTime): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `seekTime` | `number` |

###### Returns

`void`

#### Set Signature

```ts
set onSeek(value): void;
```

Defined in: [VideoPlayerEvents.ts:170](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L170)

Called when the player seeks.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`seekTime`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onSeek
```

***

### onStatusChange

#### Get Signature

```ts
get onStatusChange(): (status) => void;
```

Defined in: [VideoPlayerEvents.ts:182](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L182)

Called when the player status changes.

##### Returns

```ts
(status): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`VideoPlayerStatus`](../type-aliases/VideoPlayerStatus.md) |

###### Returns

`void`

#### Set Signature

```ts
set onStatusChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:178](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L178)

Called when the player status changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`status`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onStatusChange
```

***

### onTextTrackDataChanged

#### Get Signature

```ts
get onTextTrackDataChanged(): (texts) => void;
```

Defined in: [VideoPlayerEvents.ts:200](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L200)

Called when the text track (currently displayed subtitle) data changes.

##### Returns

```ts
(texts): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string`[] |

###### Returns

`void`

#### Set Signature

```ts
set onTextTrackDataChanged(value): void;
```

Defined in: [VideoPlayerEvents.ts:194](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L194)

Called when the text track (currently displayed subtitle) data changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`texts`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onTextTrackDataChanged
```

***

### onTimedMetadata

#### Get Signature

```ts
get onTimedMetadata(): (metadata) => void;
```

Defined in: [VideoPlayerEvents.ts:190](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L190)

Called when player receives timed metadata.

##### Returns

```ts
(metadata): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`TimedMetadata`](../interfaces/TimedMetadata.md) |

###### Returns

`void`

#### Set Signature

```ts
set onTimedMetadata(value): void;
```

Defined in: [VideoPlayerEvents.ts:186](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L186)

Called when player receives timed metadata.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`metadata`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onTimedMetadata
```

***

### onTrackChange

#### Get Signature

```ts
get onTrackChange(): (track) => void;
```

Defined in: [VideoPlayerEvents.ts:208](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L208)

Called when the selected text track changes.

##### Returns

```ts
(track): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `track` | `null` \| [`TextTrack`](../interfaces/TextTrack.md) |

###### Returns

`void`

#### Set Signature

```ts
set onTrackChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:204](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L204)

Called when the selected text track changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`track`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onTrackChange
```

***

### onVolumeChange

#### Get Signature

```ts
get onVolumeChange(): (volume) => void;
```

Defined in: [VideoPlayerEvents.ts:216](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L216)

Called when the volume of the player changes.

##### Returns

```ts
(volume): void;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `volume` | `number` |

###### Returns

`void`

#### Set Signature

```ts
set onVolumeChange(value): void;
```

Defined in: [VideoPlayerEvents.ts:212](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L212)

Called when the volume of the player changes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | (`volume`) => `void` |

##### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.onVolumeChange
```

***

### playInBackground

#### Get Signature

```ts
get playInBackground(): boolean;
```

Defined in: [VideoPlayer.ts:169](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L169)

Whether the player should play in background.

- `true` - play in background.
- `false` - pause in background (default).

##### Note

this can override [playWhenInactive](#playwheninactive).

##### Returns

`boolean`

#### Set Signature

```ts
set playInBackground(value): void;
```

Defined in: [VideoPlayer.ts:173](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L173)

Whether the player should play in background.

- `true` - play in background.
- `false` - pause in background (default).

##### Note

this can override [playWhenInactive](#playwheninactive).

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.playInBackground
```

***

### playWhenInactive

#### Get Signature

```ts
get playWhenInactive(): boolean;
```

Defined in: [VideoPlayer.ts:178](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L178)

Whether the player should play when the app is inactive (user opened control center).

- `true` - play when the app is inactive.
- `false` - pause when the app is inactive (default).

##### Note

this can be overridden by [playInBackground](#playinbackground).

##### Note

This is only supported on iOS.

##### Returns

`boolean`

#### Set Signature

```ts
set playWhenInactive(value): void;
```

Defined in: [VideoPlayer.ts:182](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L182)

Whether the player should play when the app is inactive (user opened control center).

- `true` - play when the app is inactive.
- `false` - pause when the app is inactive (default).

##### Note

this can be overridden by [playInBackground](#playinbackground).

##### Note

This is only supported on iOS.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.playWhenInactive
```

***

### rate

#### Get Signature

```ts
get rate(): number;
```

Defined in: [VideoPlayer.ts:136](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L136)

Controls the speed at which the player should play.

##### Note

if rate is = 0, it will pause video.

##### Returns

`number`

#### Set Signature

```ts
set rate(value): void;
```

Defined in: [VideoPlayer.ts:140](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L140)

Controls the speed at which the player should play.

##### Note

if rate is = 0, it will pause video.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.rate
```

***

### selectedTrack

#### Get Signature

```ts
get selectedTrack(): undefined | TextTrack;
```

Defined in: [VideoPlayer.ts:270](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L270)

Get the currently selected text track.

##### Returns

`undefined` \| [`TextTrack`](../interfaces/TextTrack.md)

The currently selected text track, or undefined if none is selected

#### Implementation of

```ts
VideoPlayerBase.selectedTrack
```

***

### source

#### Get Signature

```ts
get source(): VideoPlayerSource;
```

Defined in: [VideoPlayer.ts:85](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L85)

The source of the video.
Source is immutable. To change the source, you need to call [replaceSourceAsync](#replacesourceasync) method.
see VideoPlayerSourceBase

##### Returns

`VideoPlayerSource`

#### Implementation of

```ts
VideoPlayerBase.source
```

***

### status

#### Get Signature

```ts
get status(): VideoPlayerStatus;
```

Defined in: [VideoPlayer.ts:90](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L90)

The status of the player.

##### Returns

[`VideoPlayerStatus`](../type-aliases/VideoPlayerStatus.md)

#### Implementation of

```ts
VideoPlayerBase.status
```

***

### volume

#### Get Signature

```ts
get volume(): number;
```

Defined in: [VideoPlayer.ts:100](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L100)

The volume of the video (0.0 = 0%, 1.0 = 100%).

##### Note

If the player is [muted](#muted), the volume will be 0.0.

##### Returns

`number`

#### Set Signature

```ts
set volume(value): void;
```

Defined in: [VideoPlayer.ts:104](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L104)

The volume of the video (0.0 = 0%, 1.0 = 100%).

##### Note

If the player is [muted](#muted), the volume will be 0.0.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.volume
```

## Methods

### clearAllEvents()

```ts
clearAllEvents(): void;
```

Defined in: [VideoPlayerEvents.ts:36](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L36)

Clears all events from the event emitter.

#### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.clearAllEvents
```

***

### clearEvent()

```ts
clearEvent(event): void;
```

Defined in: [VideoPlayerEvents.ts:46](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L46)

Clears a specific event from the event emitter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | keyof [`VideoPlayerEvents`](../interfaces/VideoPlayerEvents.md) | The name of the event to clear. |

#### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.clearEvent
```

***

### getAvailableTextTracks()

```ts
getAvailableTextTracks(): TextTrack[];
```

Defined in: [VideoPlayer.ts:252](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L252)

Get all available text tracks for the current source.

#### Returns

[`TextTrack`](../interfaces/TextTrack.md)[]

Array of available text tracks

#### Implementation of

```ts
VideoPlayerBase.getAvailableTextTracks
```

***

### pause()

```ts
pause(): void;
```

Defined in: [VideoPlayer.ts:215](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L215)

Pause playback of player.

#### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.pause
```

***

### play()

```ts
play(): void;
```

Defined in: [VideoPlayer.ts:207](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L207)

Start playback of player.

#### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.play
```

***

### preload()

```ts
preload(): Promise<void>;
```

Defined in: [VideoPlayer.ts:191](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L191)

Preload the video.
This is useful to avoid delay when the user plays the video.
Preloading too many videos can lead to memory issues or performance issues.

#### Returns

`Promise`\<`void`\>

#### Implementation of

```ts
VideoPlayerBase.preload
```

***

### release()

```ts
release(): void;
```

Defined in: [VideoPlayer.ts:203](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L203)

Releases the player's native resources and releases native state.
After calling this method, the player is no longer usable.
Accessing any properties or methods of the player after calling this method will throw an error.
If you want to clean player resource use `replaceSourceAsync` with `null` instead.

#### Returns

`void`

***

### replaceSourceAsync()

```ts
replaceSourceAsync(source): Promise<void>;
```

Defined in: [VideoPlayer.ts:239](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L239)

Replace the current source of the player.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | \| `null` \| [`VideoSource`](../type-aliases/VideoSource.md) \| [`VideoConfig`](../type-aliases/VideoConfig.md) | The new source of the video. |

#### Returns

`Promise`\<`void`\>

#### Note

If you want to clear the source, you can pass null.
see VideoPlayerSourceBase

#### Implementation of

```ts
VideoPlayerBase.replaceSourceAsync
```

***

### seekBy()

```ts
seekBy(time): void;
```

Defined in: [VideoPlayer.ts:223](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L223)

Seek by given time.
If the time is negative, it will seek backward.
time will be clamped if it is out of range (0 ~ [duration](#duration)).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `time` | `number` | The time to seek from current time in seconds. |

#### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.seekBy
```

***

### seekTo()

```ts
seekTo(time): void;
```

Defined in: [VideoPlayer.ts:231](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L231)

Seek to a specific time in the video.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `time` | `number` | The time to seek to in seconds. |

#### Returns

`void`

#### Note

This have same effect as [currentTime](#currenttime) setter.

#### Note

time will be clamped if it is out of range (0 ~ [duration](#duration)).

#### Implementation of

```ts
VideoPlayerBase.seekTo
```

***

### selectTextTrack()

```ts
selectTextTrack(textTrack): void;
```

Defined in: [VideoPlayer.ts:261](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayer.ts#L261)

Select a text track to display.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `textTrack` | `null` \| [`TextTrack`](../interfaces/TextTrack.md) | Text track to select, or null to unselect current track |

#### Returns

`void`

#### Implementation of

```ts
VideoPlayerBase.selectTextTrack
```

***

### NOOP()

```ts
static NOOP(): void;
```

Defined in: [VideoPlayerEvents.ts:50](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/VideoPlayerEvents.ts#L50)

#### Returns

`void`

#### Inherited from

```ts
VideoPlayerEvents.NOOP
```
