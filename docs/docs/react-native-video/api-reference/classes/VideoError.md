# Class: VideoError\<TCode\>

Defined in: [types/VideoError.ts:32](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoError.ts#L32)

## Extends

- `Error`

## Extended by

- [`VideoComponentError`](VideoComponentError.md)
- [`VideoRuntimeError`](VideoRuntimeError.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TCode` *extends* [`VideoErrorCode`](../type-aliases/VideoErrorCode.md) |

## Accessors

### code

#### Get Signature

```ts
get code(): TCode;
```

Defined in: [types/VideoError.ts:37](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoError.ts#L37)

##### Returns

`TCode`

***

### message

#### Get Signature

```ts
get message(): string;
```

Defined in: [types/VideoError.ts:40](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoError.ts#L40)

##### Returns

`string`

#### Overrides

```ts
Error.message
```

***

### stack

#### Get Signature

```ts
get stack(): undefined | string;
```

Defined in: [types/VideoError.ts:44](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoError.ts#L44)

##### Returns

`undefined` \| `string`

#### Overrides

```ts
Error.stack
```

## Methods

### toString()

```ts
toString(): string;
```

Defined in: [types/VideoError.ts:61](https://github.com/TheWidlarzGroup/react-native-video/blob/f9ee42c2a80c20dca2b87dac6bcb2898c1a425c5/packages/react-native-video/src/core/types/VideoError.ts#L61)

Returns a string representation of an object.

#### Returns

`string`
