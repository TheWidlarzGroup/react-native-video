# Function: useEvent()

```ts
function useEvent<T>(
   player, 
   event, 
   callback): void;
```

Defined in: [hooks/useEvent.ts:25](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/hooks/useEvent.ts#L25)

Attaches an event listener to a `VideoPlayer` instance for a specified event.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `Events` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `player` | [`VideoPlayer`](../classes/VideoPlayer.md) | The player to attach the event to |
| `event` | `T` | The name of the event to attach the callback to |
| `callback` | (...`args`) => `void` | The callback for the event |

## Returns

`void`
