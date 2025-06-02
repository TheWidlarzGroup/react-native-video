# Class: VideoError\<TCode\>

Defined in: [types/VideoError.ts:31](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoError.ts#L31)

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

Defined in: [types/VideoError.ts:36](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoError.ts#L36)

##### Returns

`TCode`

***

### message

#### Get Signature

```ts
get message(): string;
```

Defined in: [types/VideoError.ts:39](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoError.ts#L39)

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

Defined in: [types/VideoError.ts:43](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoError.ts#L43)

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

Defined in: [types/VideoError.ts:60](https://github.com/TheWidlarzGroup/react-native-video-v7/blob/d4046f8eca07df9e2ec69f8007c800ebf23ec7a7/packages/react-native-video/src/core/types/VideoError.ts#L60)

Returns a string representation of an object.

#### Returns

`string`
