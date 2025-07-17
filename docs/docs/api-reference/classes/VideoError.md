# Class: VideoError\<TCode\>

Defined in: [types/VideoError.ts:32](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L32)

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

Defined in: [types/VideoError.ts:37](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L37)

##### Returns

`TCode`

***

### message

#### Get Signature

```ts
get message(): string;
```

Defined in: [types/VideoError.ts:40](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L40)

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

Defined in: [types/VideoError.ts:44](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L44)

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

Defined in: [types/VideoError.ts:61](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L61)

Returns a string representation of an object.

#### Returns

`string`
