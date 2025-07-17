# Class: VideoRuntimeError

Defined in: [types/VideoError.ts:69](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L69)

## Extends

- [`VideoError`](VideoError.md)\<
  \| [`LibraryError`](../type-aliases/LibraryError.md)
  \| [`PlayerError`](../type-aliases/PlayerError.md)
  \| [`SourceError`](../type-aliases/SourceError.md)
  \| [`UnknownError`](../type-aliases/UnknownError.md)\>

## Accessors

### code

#### Get Signature

```ts
get code(): TCode;
```

Defined in: [types/VideoError.ts:37](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L37)

##### Returns

`TCode`

#### Inherited from

[`VideoError`](VideoError.md).[`code`](VideoError.md#code)

***

### message

#### Get Signature

```ts
get message(): string;
```

Defined in: [types/VideoError.ts:40](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L40)

##### Returns

`string`

#### Inherited from

[`VideoError`](VideoError.md).[`message`](VideoError.md#message)

***

### stack

#### Get Signature

```ts
get stack(): undefined | string;
```

Defined in: [types/VideoError.ts:44](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L44)

##### Returns

`undefined` \| `string`

#### Inherited from

[`VideoError`](VideoError.md).[`stack`](VideoError.md#stack)

## Methods

### toString()

```ts
toString(): string;
```

Defined in: [types/VideoError.ts:61](https://github.com/TheWidlarzGroup/react-native-video/blob/af801fa4d9043aca201183cd46f4c2b7b6814b4d/packages/react-native-video/src/core/types/VideoError.ts#L61)

Returns a string representation of an object.

#### Returns

`string`

#### Inherited from

[`VideoError`](VideoError.md).[`toString`](VideoError.md#tostring)
