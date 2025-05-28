[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / LexicalEnvType

# Class: LexicalEnvType

Defined in: src/core/base/Type.ts:770

## Extends

- [`Type`](Type.md)

## Constructors

### Constructor

> **new LexicalEnvType**(`nestedMethod`, `closures?`): `LexicalEnvType`

Defined in: src/core/base/Type.ts:774

#### Parameters

##### nestedMethod

[`MethodSignature`](MethodSignature.md)

##### closures?

[`Local`](Local.md)[]

#### Returns

`LexicalEnvType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Methods

### addClosure()

> **addClosure**(`closure`): `void`

Defined in: src/core/base/Type.ts:788

#### Parameters

##### closure

[`Local`](Local.md)

#### Returns

`void`

***

### getClosures()

> **getClosures**(): [`Local`](Local.md)[]

Defined in: src/core/base/Type.ts:784

#### Returns

[`Local`](Local.md)[]

***

### getNestedMethod()

> **getNestedMethod**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/base/Type.ts:780

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:792

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
