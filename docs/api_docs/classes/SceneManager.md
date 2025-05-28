[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / SceneManager

# Class: SceneManager

Defined in: src/utils/callGraphUtils.ts:75

## Constructors

### Constructor

> **new SceneManager**(): `SceneManager`

#### Returns

`SceneManager`

## Accessors

### scene

#### Get Signature

> **get** **scene**(): [`Scene`](Scene.md)

Defined in: src/utils/callGraphUtils.ts:78

##### Returns

[`Scene`](Scene.md)

#### Set Signature

> **set** **scene**(`value`): `void`

Defined in: src/utils/callGraphUtils.ts:82

##### Parameters

###### value

[`Scene`](Scene.md)

##### Returns

`void`

## Methods

### getClass()

> **getClass**(`arkClass`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/utils/callGraphUtils.ts:104

#### Parameters

##### arkClass

[`ClassSignature`](ClassSignature.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getExtendedClasses()

> **getExtendedClasses**(`arkClass`): [`ArkClass`](ArkClass.md)[]

Defined in: src/utils/callGraphUtils.ts:124

#### Parameters

##### arkClass

[`ClassSignature`](ClassSignature.md)

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getMethod()

> **getMethod**(`method`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/utils/callGraphUtils.ts:86

#### Parameters

##### method

[`MethodSignature`](MethodSignature.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)
