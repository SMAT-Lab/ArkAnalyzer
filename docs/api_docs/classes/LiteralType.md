[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / LiteralType

# Class: LiteralType

Defined in: src/core/base/Type.ts:225

literal type

## Extends

- [`PrimitiveType`](PrimitiveType.md)

## Constructors

### Constructor

> **new LiteralType**(`literalName`): `LiteralType`

Defined in: src/core/base/Type.ts:231

#### Parameters

##### literalName

`string` | `number` | `boolean`

#### Returns

`LiteralType`

#### Overrides

[`PrimitiveType`](PrimitiveType.md).[`constructor`](PrimitiveType.md#constructor)

## Properties

### FALSE

> `readonly` `static` **FALSE**: `LiteralType`

Defined in: src/core/base/Type.ts:227

***

### TRUE

> `readonly` `static` **TRUE**: `LiteralType`

Defined in: src/core/base/Type.ts:226

## Methods

### getLiteralName()

> **getLiteralName**(): `string` \| `number` \| `boolean`

Defined in: src/core/base/Type.ts:236

#### Returns

`string` \| `number` \| `boolean`

***

### getName()

> **getName**(): `string`

Defined in: src/core/base/Type.ts:128

#### Returns

`string`

#### Inherited from

[`PrimitiveType`](PrimitiveType.md).[`getName`](PrimitiveType.md#getname)

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:240

#### Returns

`string`

#### Overrides

[`PrimitiveType`](PrimitiveType.md).[`getTypeString`](PrimitiveType.md#gettypestring)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Type.ts:38

#### Returns

`string`

#### Inherited from

[`PrimitiveType`](PrimitiveType.md).[`toString`](PrimitiveType.md#tostring)
