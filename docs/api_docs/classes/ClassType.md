[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ClassType

# Class: ClassType

Defined in: src/core/base/Type.ts:413

type of an object

## Extends

- [`Type`](Type.md)

## Constructors

### Constructor

> **new ClassType**(`classSignature`, `realGenericTypes?`): `ClassType`

Defined in: src/core/base/Type.ts:417

#### Parameters

##### classSignature

[`ClassSignature`](ClassSignature.md)

##### realGenericTypes?

[`Type`](Type.md)[]

#### Returns

`ClassType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### getClassSignature()

> **getClassSignature**(): [`ClassSignature`](ClassSignature.md)

Defined in: src/core/base/Type.ts:423

#### Returns

[`ClassSignature`](ClassSignature.md)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:431

#### Returns

`undefined` \| [`Type`](Type.md)[]

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:439

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### setClassSignature()

> **setClassSignature**(`newClassSignature`): `void`

Defined in: src/core/base/Type.ts:427

#### Parameters

##### newClassSignature

[`ClassSignature`](ClassSignature.md)

#### Returns

`void`

***

### setRealGenericTypes()

> **setRealGenericTypes**(`types`): `void`

Defined in: src/core/base/Type.ts:435

#### Parameters

##### types

`undefined` | [`Type`](Type.md)[]

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
