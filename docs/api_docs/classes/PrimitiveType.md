[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PrimitiveType

# Class: `abstract` PrimitiveType

Defined in: src/core/base/Type.ts:120

primitive type

## Extends

- [`Type`](Type.md)

## Extended by

- [`BooleanType`](BooleanType.md)
- [`NumberType`](NumberType.md)
- [`BigIntType`](BigIntType.md)
- [`StringType`](StringType.md)
- [`NullType`](NullType.md)
- [`UndefinedType`](UndefinedType.md)
- [`LiteralType`](LiteralType.md)

## Constructors

### Constructor

> **new PrimitiveType**(`name`): `PrimitiveType`

Defined in: src/core/base/Type.ts:123

#### Parameters

##### name

`string`

#### Returns

`PrimitiveType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### getName()

> **getName**(): `string`

Defined in: src/core/base/Type.ts:128

#### Returns

`string`

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:132

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Type.ts:38

#### Returns

`string`

#### Inherited from

[`Type`](Type.md).[`toString`](Type.md#tostring)
