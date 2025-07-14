# Function: useVideoPlayer()

```ts
function useVideoPlayer(source, setup?): VideoPlayer;
```

Defined in: [hooks/useVideoPlayer.ts:26](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/hooks/useVideoPlayer.ts#L26)

Creates a `VideoPlayer` instance and manages its lifecycle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | \| [`VideoSource`](../type-aliases/VideoSource.md) \| [`VideoConfig`](../type-aliases/VideoConfig.md) | The source of the video to play |
| `setup?` | (`player`) => `void` | A function to setup the player |

## Returns

[`VideoPlayer`](../classes/VideoPlayer.md)

The `VideoPlayer` instance
