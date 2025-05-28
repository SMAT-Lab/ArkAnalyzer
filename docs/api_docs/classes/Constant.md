[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Constant

# Class: Constant

Defined in: src/core/base/Constant.ts:23

## Implements

- [`Value`](../interfaces/Value.md)

## Constructors

### Constructor

> **new Constant**(`value`, `type`): `Constant`

Defined in: src/core/base/Constant.ts:27

#### Parameters

##### value

`string`

##### type

[`Type`](Type.md)

#### Returns

`Constant`

## Methods

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Constant.ts:48

Returns the type of this constant.

#### Returns

[`Type`](Type.md)

The type of this constant.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getType`](../interfaces/Value.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Constant.ts:40

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getUses`](../interfaces/Value.md#getuses)

***

### getValue()

> **getValue**(): `string`

Defined in: src/core/base/Constant.ts:36

Returns the constant's value as a **string**.

#### Returns

`string`

The constant's value.

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Constant.ts:56

Get a string of constant value in Constant.

#### Returns

`string`

The string of constant value.
