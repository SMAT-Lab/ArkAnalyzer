[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ClosureType

# Class: ClosureType

Defined in: src/core/base/Type.ts:392

types for closures which is a special FunctionType with a lexical env

## Extends

- [`FunctionType`](FunctionType.md)

## Constructors

### Constructor

> **new ClosureType**(`lexicalEnv`, `methodSignature`, `realGenericTypes?`): `ClosureType`

Defined in: src/core/base/Type.ts:395

#### Parameters

##### lexicalEnv

[`LexicalEnvType`](LexicalEnvType.md)

##### methodSignature

[`MethodSignature`](MethodSignature.md)

##### realGenericTypes?

[`Type`](Type.md)[]

#### Returns

`ClosureType`

#### Overrides

[`FunctionType`](FunctionType.md).[`constructor`](FunctionType.md#constructor)

## Methods

### getLexicalEnv()

> **getLexicalEnv**(): [`LexicalEnvType`](LexicalEnvType.md)

Defined in: src/core/base/Type.ts:400

#### Returns

[`LexicalEnvType`](LexicalEnvType.md)

***

### getMethodSignature()

> **getMethodSignature**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/base/Type.ts:375

#### Returns

[`MethodSignature`](MethodSignature.md)

#### Inherited from

[`FunctionType`](FunctionType.md).[`getMethodSignature`](FunctionType.md#getmethodsignature)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:379

#### Returns

`undefined` \| [`Type`](Type.md)[]

#### Inherited from

[`FunctionType`](FunctionType.md).[`getRealGenericTypes`](FunctionType.md#getrealgenerictypes)

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:404

#### Returns

`string`

#### Overrides

[`FunctionType`](FunctionType.md).[`getTypeString`](FunctionType.md#gettypestring)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Type.ts:38

#### Returns

`string`

#### Inherited from

[`FunctionType`](FunctionType.md).[`toString`](FunctionType.md#tostring)
