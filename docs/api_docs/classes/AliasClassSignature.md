[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AliasClassSignature

# Class: AliasClassSignature

Defined in: src/core/model/ArkSignature.ts:192

`AliasClassSignature` is used to extend `ClassSignature`, preserving the actual name used during invocation.

## Extends

- [`ClassSignature`](ClassSignature.md)

## Constructors

### Constructor

> **new AliasClassSignature**(`aliasName`, `signature`): `AliasClassSignature`

Defined in: src/core/model/ArkSignature.ts:195

#### Parameters

##### aliasName

`string`

##### signature

[`ClassSignature`](ClassSignature.md)

#### Returns

`AliasClassSignature`

#### Overrides

[`ClassSignature`](ClassSignature.md).[`constructor`](ClassSignature.md#constructor)

## Properties

### DEFAULT

> `readonly` `static` **DEFAULT**: [`ClassSignature`](ClassSignature.md)

Defined in: src/core/model/ArkSignature.ts:117

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`DEFAULT`](ClassSignature.md#default)

## Methods

### getClassName()

> **getClassName**(): `string`

Defined in: src/core/model/ArkSignature.ts:203

Returns the name used in the code.

#### Returns

`string`

#### Overrides

[`ClassSignature`](ClassSignature.md).[`getClassName`](ClassSignature.md#getclassname)

***

### getDeclaringClassName()

> **getDeclaringClassName**(): `string`

Defined in: src/core/model/ArkSignature.ts:153

#### Returns

`string`

The name of the declare class.

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`getDeclaringClassName`](ClassSignature.md#getdeclaringclassname)

***

### getDeclaringFileSignature()

> **getDeclaringFileSignature**(): [`FileSignature`](FileSignature.md)

Defined in: src/core/model/ArkSignature.ts:129

Returns the declaring file signature.

#### Returns

[`FileSignature`](FileSignature.md)

The declaring file signature.

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`getDeclaringFileSignature`](ClassSignature.md#getdeclaringfilesignature)

***

### getDeclaringNamespaceSignature()

> **getDeclaringNamespaceSignature**(): `null` \| [`NamespaceSignature`](NamespaceSignature.md)

Defined in: src/core/model/ArkSignature.ts:137

Get the declaring namespace's signature.

#### Returns

`null` \| [`NamespaceSignature`](NamespaceSignature.md)

the declaring namespace's signature.

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`getDeclaringNamespaceSignature`](ClassSignature.md#getdeclaringnamespacesignature)

***

### getOriginName()

> **getOriginName**(): `string`

Defined in: src/core/model/ArkSignature.ts:210

Return the original name of declared class

#### Returns

`string`

***

### getType()

> **getType**(): [`ClassType`](ClassType.md)

Defined in: src/core/model/ArkSignature.ts:168

#### Returns

[`ClassType`](ClassType.md)

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`getType`](ClassSignature.md#gettype)

***

### setClassName()

> **setClassName**(`className`): `void`

Defined in: src/core/model/ArkSignature.ts:164

#### Parameters

##### className

`string`

#### Returns

`void`

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`setClassName`](ClassSignature.md#setclassname)

***

### toMapKey()

> **toMapKey**(): `string`

Defined in: src/core/model/ArkSignature.ts:180

#### Returns

`string`

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`toMapKey`](ClassSignature.md#tomapkey)

***

### toString()

> **toString**(): `string`

Defined in: src/core/model/ArkSignature.ts:172

#### Returns

`string`

#### Inherited from

[`ClassSignature`](ClassSignature.md).[`toString`](ClassSignature.md#tostring)
