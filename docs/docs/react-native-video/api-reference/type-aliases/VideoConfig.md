# Type Alias: VideoConfig

```ts
type VideoConfig = object;
```

Defined in: [types/VideoConfig.ts:3](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoConfig.ts#L3)

## Properties

### externalSubtitles?

```ts
optional externalSubtitles: ExternalSubtitle[];
```

Defined in: [types/VideoConfig.ts:22](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoConfig.ts#L22)

The external subtitles to be used.

#### Note

on iOS, side loaded subtitles are not supported if source is stream.

***

### headers?

```ts
optional headers: Record<string, string>;
```

Defined in: [types/VideoConfig.ts:17](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoConfig.ts#L17)

The headers to be sent with the request.

***

### uri

```ts
uri: VideoSource;
```

Defined in: [types/VideoConfig.ts:13](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoConfig.ts#L13)

The uri of the video.

#### Example

```ts
uri: 'https://example.com/video.mp4'
// or
uri: require('./assets/video.mp4')
```
