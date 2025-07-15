# Function: useVideoPlayer()

```ts
function useVideoPlayer(source, setup?): VideoPlayer;
```

Defined in: [hooks/useVideoPlayer.ts:26](https://github.com/TheWidlarzGroup/react-native-video/blob/1403959cf63e77ce519800110e1872cc843e5d0f/packages/react-native-video/src/core/hooks/useVideoPlayer.ts#L26)

Creates a `VideoPlayer` instance and manages its lifecycle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | \| [`VideoSource`](../type-aliases/VideoSource.md) \| [`VideoConfig`](../type-aliases/VideoConfig.md) | The source of the video to play |
| `setup?` | (`player`) => `void` | A function to setup the player |

## Returns

[`VideoPlayer`](../classes/VideoPlayer.md)

The `VideoPlayer` instance
