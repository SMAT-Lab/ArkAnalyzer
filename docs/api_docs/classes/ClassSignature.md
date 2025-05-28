[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ClassSignature

# Class: ClassSignature

Defined in: src/core/model/ArkSignature.ts:112

## Extended by

- [`AliasClassSignature`](AliasClassSignature.md)

## Constructors

### Constructor

> **new ClassSignature**(`className`, `declaringFileSignature`, `declaringNamespaceSignature`): `ClassSignature`

Defined in: src/core/model/ArkSignature.ts:119

#### Parameters

##### className

`string`

##### declaringFileSignature

[`FileSignature`](FileSignature.md)

##### declaringNamespaceSignature

`null` | [`NamespaceSignature`](NamespaceSignature.md)

#### Returns

`ClassSignature`

## Properties

### DEFAULT

> `readonly` `static` **DEFAULT**: `ClassSignature`

Defined in: src/core/model/ArkSignature.ts:117

## Methods

### getClassName()

> **getClassName**(): `string`

Defined in: src/core/model/ArkSignature.ts:145

Get the **string** name of class from the the class signature. The default value is `""`.

#### Returns

`string`

The name of this class.

***

### getDeclaringClassName()

> **getDeclaringClassName**(): `string`

Defined in: src/core/model/ArkSignature.ts:153

#### Returns

`string`

The name of the declare class.

***

### getDeclaringFileSignature()

> **getDeclaringFileSignature**(): [`FileSignature`](FileSignature.md)

Defined in: src/core/model/ArkSignature.ts:129

Returns the declaring file signature.

#### Returns

[`FileSignature`](FileSignature.md)

The declaring file signature.

***

### getDeclaringNamespaceSignature()

> **getDeclaringNamespaceSignature**(): `null` \| [`NamespaceSignature`](NamespaceSignature.md)

Defined in: src/core/model/ArkSignature.ts:137

Get the declaring namespace's signature.

#### Returns

`null` \| [`NamespaceSignature`](NamespaceSignature.md)

the declaring namespace's signature.

***

### getType()

> **getType**(): [`ClassType`](ClassType.md)

Defined in: src/core/model/ArkSignature.ts:168

#### Returns

[`ClassType`](ClassType.md)

***

### setClassName()

> **setClassName**(`className`): `void`

Defined in: src/core/model/ArkSignature.ts:164

#### Parameters

##### className

`string`

#### Returns

`void`

***

### toMapKey()

> **toMapKey**(): `string`

Defined in: src/core/model/ArkSignature.ts:180

#### Returns

`string`

***

### toString()

> **toString**(): `string`

Defined in: src/core/model/ArkSignature.ts:172

#### Returns

`string`
