# Type Alias: VideoConfig

```ts
type VideoConfig = object;
```

Defined in: [types/VideoConfig.ts:3](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoConfig.ts#L3)

## Properties

### externalSubtitles?

```ts
optional externalSubtitles: ExternalSubtitle[];
```

Defined in: [types/VideoConfig.ts:40](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoConfig.ts#L40)

The external subtitles to be used.

#### Note

on iOS, only WebVTT (.vtt) subtitles are supported (for HLS streams and MP4 files).

#### Note

on iOS, `label` can be overridden by player and there is no way to get around it.

#### Example

```ts
externalSubtitles: [
  {
    uri: 'https://example.com/subtitles_en.vtt',
    label: 'English',
    type: 'vtt',
    language: 'en'
  },
  {
    uri: 'https://example.com/subtitles_es.vtt',
    label: 'Español',
    type: 'vtt',
    language: 'es'
  }
]
```

***

### headers?

```ts
optional headers: Record<string, string>;
```

Defined in: [types/VideoConfig.ts:17](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoConfig.ts#L17)

The headers to be sent with the request.

***

### uri

```ts
uri: VideoSource;
```

Defined in: [types/VideoConfig.ts:13](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoConfig.ts#L13)

The uri of the video.

#### Example

```ts
uri: 'https://example.com/video.mp4'
// or
uri: require('./assets/video.mp4')
```
