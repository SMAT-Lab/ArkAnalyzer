[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / UnionType

# Class: UnionType

Defined in: src/core/base/Type.ts:249

union type

## Extends

- [`Type`](Type.md)

## Constructors

### Constructor

> **new UnionType**(`types`, `currType`): `UnionType`

Defined in: src/core/base/Type.ts:252

#### Parameters

##### types

[`Type`](Type.md)[]

##### currType

[`Type`](Type.md) = `...`

#### Returns

`UnionType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### flatType()

> **flatType**(): [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:283

#### Returns

[`Type`](Type.md)[]

***

### getCurrType()

> **getCurrType**(): [`Type`](Type.md)

Defined in: src/core/base/Type.ts:262

#### Returns

[`Type`](Type.md)

***

### getTypes()

> **getTypes**(): [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:258

#### Returns

[`Type`](Type.md)[]

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:270

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### setCurrType()

> **setCurrType**(`newType`): `void`

Defined in: src/core/base/Type.ts:266

#### Parameters

##### newType

[`Type`](Type.md)

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
