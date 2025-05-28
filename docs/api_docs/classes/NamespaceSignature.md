[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / NamespaceSignature

# Class: NamespaceSignature

Defined in: src/core/model/ArkSignature.ts:70

## Constructors

### Constructor

> **new NamespaceSignature**(`namespaceName`, `declaringFileSignature`, `declaringNamespaceSignature`): `NamespaceSignature`

Defined in: src/core/model/ArkSignature.ts:77

#### Parameters

##### namespaceName

`string`

##### declaringFileSignature

[`FileSignature`](FileSignature.md)

##### declaringNamespaceSignature

`null` | `NamespaceSignature`

#### Returns

`NamespaceSignature`

## Properties

### DEFAULT

> `readonly` `static` **DEFAULT**: `NamespaceSignature`

Defined in: src/core/model/ArkSignature.ts:75

## Methods

### getDeclaringFileSignature()

> **getDeclaringFileSignature**(): [`FileSignature`](FileSignature.md)

Defined in: src/core/model/ArkSignature.ts:87

#### Returns

[`FileSignature`](FileSignature.md)

***

### getDeclaringNamespaceSignature()

> **getDeclaringNamespaceSignature**(): `null` \| `NamespaceSignature`

Defined in: src/core/model/ArkSignature.ts:91

#### Returns

`null` \| `NamespaceSignature`

***

### getNamespaceName()

> **getNamespaceName**(): `string`

Defined in: src/core/model/ArkSignature.ts:83

#### Returns

`string`

***

### toMapKey()

> **toMapKey**(): `string`

Defined in: src/core/model/ArkSignature.ts:103

#### Returns

`string`

***

### toString()

> **toString**(): `string`

Defined in: src/core/model/ArkSignature.ts:95

#### Returns

`string`
