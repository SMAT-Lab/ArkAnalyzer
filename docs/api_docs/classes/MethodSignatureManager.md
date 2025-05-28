[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / MethodSignatureManager

# Class: MethodSignatureManager

Defined in: src/utils/callGraphUtils.ts:25

## Constructors

### Constructor

> **new MethodSignatureManager**(): `MethodSignatureManager`

#### Returns

`MethodSignatureManager`

## Accessors

### processedList

#### Get Signature

> **get** **processedList**(): [`MethodSignature`](MethodSignature.md)[]

Defined in: src/utils/callGraphUtils.ts:37

##### Returns

[`MethodSignature`](MethodSignature.md)[]

#### Set Signature

> **set** **processedList**(`list`): `void`

Defined in: src/utils/callGraphUtils.ts:41

##### Parameters

###### list

[`MethodSignature`](MethodSignature.md)[]

##### Returns

`void`

***

### workList

#### Get Signature

> **get** **workList**(): [`MethodSignature`](MethodSignature.md)[]

Defined in: src/utils/callGraphUtils.ts:29

##### Returns

[`MethodSignature`](MethodSignature.md)[]

#### Set Signature

> **set** **workList**(`list`): `void`

Defined in: src/utils/callGraphUtils.ts:33

##### Parameters

###### list

[`MethodSignature`](MethodSignature.md)[]

##### Returns

`void`

## Methods

### addToProcessedList()

> **addToProcessedList**(`signature`): `void`

Defined in: src/utils/callGraphUtils.ts:60

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`

***

### addToWorkList()

> **addToWorkList**(`signature`): `void`

Defined in: src/utils/callGraphUtils.ts:54

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`

***

### findInProcessedList()

> **findInProcessedList**(`signature`): `boolean`

Defined in: src/utils/callGraphUtils.ts:49

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`boolean`

***

### findInWorkList()

> **findInWorkList**(`signature`): `undefined` \| [`MethodSignature`](MethodSignature.md)

Defined in: src/utils/callGraphUtils.ts:45

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`undefined` \| [`MethodSignature`](MethodSignature.md)

***

### removeFromProcessedList()

> **removeFromProcessedList**(`signature`): `void`

Defined in: src/utils/callGraphUtils.ts:70

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`

***

### removeFromWorkList()

> **removeFromWorkList**(`signature`): `void`

Defined in: src/utils/callGraphUtils.ts:66

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`
