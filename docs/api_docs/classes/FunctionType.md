[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / FunctionType

# Class: FunctionType

Defined in: src/core/base/Type.ts:365

function type

## Extends

- [`Type`](Type.md)

## Extended by

- [`ClosureType`](ClosureType.md)

## Constructors

### Constructor

> **new FunctionType**(`methodSignature`, `realGenericTypes?`): `FunctionType`

Defined in: src/core/base/Type.ts:369

#### Parameters

##### methodSignature

[`MethodSignature`](MethodSignature.md)

##### realGenericTypes?

[`Type`](Type.md)[]

#### Returns

`FunctionType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### getMethodSignature()

> **getMethodSignature**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/base/Type.ts:375

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:379

#### Returns

`undefined` \| [`Type`](Type.md)[]

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:383

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
