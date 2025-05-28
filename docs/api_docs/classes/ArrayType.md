[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArrayType

# Class: ArrayType

Defined in: src/core/base/Type.ts:462

Array type

## Example

```typescript
// baseType is number, dimension is 1, readonlyFlag is true
let a: readonly number[] = [1, 2, 3];

// baseType is number, dimension is 1, readonlyFlag is undefined
let a: number[] = [1, 2, 3];
```

## Extends

- [`Type`](Type.md)

## Constructors

### Constructor

> **new ArrayType**(`baseType`, `dimension`): `ArrayType`

Defined in: src/core/base/Type.ts:467

#### Parameters

##### baseType

[`Type`](Type.md)

##### dimension

`number`

#### Returns

`ArrayType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### getBaseType()

> **getBaseType**(): [`Type`](Type.md)

Defined in: src/core/base/Type.ts:477

Returns the base type of this array, such as `Any`, `Unknown`, `TypeParameter`, etc.

#### Returns

[`Type`](Type.md)

The base type of array.

***

### getDimension()

> **getDimension**(): `number`

Defined in: src/core/base/Type.ts:485

#### Returns

`number`

***

### getReadonlyFlag()

> **getReadonlyFlag**(): `undefined` \| `boolean`

Defined in: src/core/base/Type.ts:493

#### Returns

`undefined` \| `boolean`

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:497

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### setBaseType()

> **setBaseType**(`newType`): `void`

Defined in: src/core/base/Type.ts:481

#### Parameters

##### newType

[`Type`](Type.md)

#### Returns

`void`

***

### setReadonlyFlag()

> **setReadonlyFlag**(`readonlyFlag`): `void`

Defined in: src/core/base/Type.ts:489

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
