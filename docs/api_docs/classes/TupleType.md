[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / TupleType

# Class: TupleType

Defined in: src/core/base/Type.ts:527

Tuple type

## Example

```typescript
// types are number and string, dimension is 1, readonlyFlag is true
let a: readonly number[] = [1, 2, 3];

// baseType is number, dimension is 1, readonlyFlag is undefined
let a: number[] = [1, 2, 3];
```

## Extends

- [`Type`](Type.md)

## Constructors

### Constructor

> **new TupleType**(`types`): `TupleType`

Defined in: src/core/base/Type.ts:531

#### Parameters

##### types

[`Type`](Type.md)[]

#### Returns

`TupleType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### getReadonlyFlag()

> **getReadonlyFlag**(): `undefined` \| `boolean`

Defined in: src/core/base/Type.ts:544

#### Returns

`undefined` \| `boolean`

***

### getTypes()

> **getTypes**(): [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:536

#### Returns

[`Type`](Type.md)[]

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:548

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### setReadonlyFlag()

> **setReadonlyFlag**(`readonlyFlag`): `void`

Defined in: src/core/base/Type.ts:540

#### Parameters

##### readonlyFlag

`boolean`

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Type.ts:38

#### Returns

`string`

#### Inherited from

[`Type`](Type.md).[`toString`](Type.md#tostring)
