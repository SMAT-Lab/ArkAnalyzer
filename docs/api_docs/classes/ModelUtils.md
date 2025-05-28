[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ModelUtils

# Class: ModelUtils

Defined in: src/core/common/ModelUtils.ts:56

## Constructors

### Constructor

> **new ModelUtils**(): `ModelUtils`

#### Returns

`ModelUtils`

## Properties

### implicitArkUIBuilderMethods

> `static` **implicitArkUIBuilderMethods**: `Set`\<[`ArkMethod`](ArkMethod.md)\>

Defined in: src/core/common/ModelUtils.ts:57

## Methods

### findArkModel()

> `static` **findArkModel**(`baseName`, `arkClass`): `null` \| [`ArkField`](ArkField.md) \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:424

#### Parameters

##### baseName

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkField`](ArkField.md) \| `ArkExport`

***

### findArkModelByRefName()

> `static` **findArkModelByRefName**(`refName`, `arkClass`): `null` \| [`ArkField`](ArkField.md) \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:454

#### Parameters

##### refName

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkField`](ArkField.md) \| `ArkExport`

***

### findArkModelBySignature()

> `static` **findArkModelBySignature**(`signature`, `scene`): `null` \| [`ArkField`](ArkField.md) \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:481

#### Parameters

##### signature

[`Signature`](../type-aliases/Signature.md)

##### scene

[`Scene`](Scene.md)

#### Returns

`null` \| [`ArkField`](ArkField.md) \| `ArkExport`

***

### findDeclaredLocal()

> `static` **findDeclaredLocal**(`local`, `arkMethod`, `times`): `null` \| [`Local`](Local.md)

Defined in: src/core/common/ModelUtils.ts:377

#### Parameters

##### local

[`Local`](Local.md)

##### arkMethod

[`ArkMethod`](ArkMethod.md)

##### times

`number` = `0`

#### Returns

`null` \| [`Local`](Local.md)

***

### findGlobalRef()

> `static` **findGlobalRef**(`refName`, `method`): `null` \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:446

#### Parameters

##### refName

`string`

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`null` \| `ArkExport`

***

### findPropertyInClass()

> `static` **findPropertyInClass**(`name`, `arkClass`): `null` \| [`ArkField`](ArkField.md) \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:356

#### Parameters

##### name

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkField`](ArkField.md) \| `ArkExport`

***

### findPropertyInNamespace()

> `static` **findPropertyInNamespace**(`name`, `namespace`): `undefined` \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:345

#### Parameters

##### name

`string`

##### namespace

[`ArkNamespace`](ArkNamespace.md)

#### Returns

`undefined` \| `ArkExport`

***

### getAllClassesInFile()

> `static` **getAllClassesInFile**(`arkFile`): [`ArkClass`](ArkClass.md)[]

Defined in: src/core/common/ModelUtils.ts:276

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getAllMethodsInFile()

> `static` **getAllMethodsInFile**(`arkFile`): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/core/common/ModelUtils.ts:284

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

[`ArkMethod`](ArkMethod.md)[]

***

### getAllNamespacesInFile()

> `static` **getAllNamespacesInFile**(`arkFile`): [`ArkNamespace`](ArkNamespace.md)[]

Defined in: src/core/common/ModelUtils.ts:260

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

[`ArkNamespace`](ArkNamespace.md)[]

***

### getAllNamespacesInNamespace()

> `static` **getAllNamespacesInNamespace**(`arkNamespace`, `allNamespaces`): `void`

Defined in: src/core/common/ModelUtils.ts:269

#### Parameters

##### arkNamespace

[`ArkNamespace`](ArkNamespace.md)

##### allNamespaces

[`ArkNamespace`](ArkNamespace.md)[]

#### Returns

`void`

***

### getArkClassInBuild()

> `static` **getArkClassInBuild**(`scene`, `classType`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:304

#### Parameters

##### scene

[`Scene`](Scene.md)

##### classType

[`ClassType`](ClassType.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getArkExportInImportInfoWithName()

> `static` **getArkExportInImportInfoWithName**(`name`, `arkFile`): `null` \| `ArkExport`

Defined in: src/core/common/ModelUtils.ts:142

search type within the given file import infos

#### Parameters

##### name

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| `ArkExport`

***

### getClass()

> `static` **getClass**(`method`, `signature`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:318

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

##### signature

[`ClassSignature`](ClassSignature.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClassInFileWithName()

> `static` **getClassInFileWithName**(`className`, `arkFile`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:125

search class within the given file

#### Parameters

##### className

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClassInImportInfoWithName()

> `static` **getClassInImportInfoWithName**(`className`, `arkFile`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:133

#### Parameters

##### className

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClassWithName()

> `static` **getClassWithName**(`className`, `thisClass`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:113

search class within the file that contain the given method

#### Parameters

##### className

`string`

##### thisClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClassWithNameFromClass()

> `static` **getClassWithNameFromClass**(`className`, `startFrom`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:85

#### Parameters

##### className

`string`

##### startFrom

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClassWithNameInNamespaceRecursively()

> `static` **getClassWithNameInNamespaceRecursively**(`className`, `ns`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:68

#### Parameters

##### className

`string`

##### ns

[`ArkNamespace`](ArkNamespace.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getDefaultClass()

> `static` **getDefaultClass**(`arkClass`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/common/ModelUtils.ts:314

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getLocalInImportInfoWithName()

> `static` **getLocalInImportInfoWithName**(`localName`, `arkFile`): `null` \| [`Local`](Local.md)

Defined in: src/core/common/ModelUtils.ts:251

#### Parameters

##### localName

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`Local`](Local.md)

***

### getMethodSignatureFromArkClass()

> `static` **getMethodSignatureFromArkClass**(`arkClass`, `methodName`): `null` \| [`MethodSignature`](MethodSignature.md)

Defined in: src/core/common/ModelUtils.ts:59

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

##### methodName

`string`

#### Returns

`null` \| [`MethodSignature`](MethodSignature.md)

***

### getMethodWithName()

> `static` **getMethodWithName**(`methodName`, `startFrom`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/common/ModelUtils.ts:147

search method within the file that contain the given method

#### Parameters

##### methodName

`string`

##### startFrom

[`ArkMethod`](ArkMethod.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getNamespaceInFileWithName()

> `static` **getNamespaceInFileWithName**(`namespaceName`, `arkFile`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/common/ModelUtils.ts:201

#### Parameters

##### namespaceName

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getNamespaceInImportInfoWithName()

> `static` **getNamespaceInImportInfoWithName**(`namespaceName`, `arkFile`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/common/ModelUtils.ts:210

#### Parameters

##### namespaceName

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getNamespaceWithName()

> `static` **getNamespaceWithName**(`namespaceName`, `thisClass`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/common/ModelUtils.ts:188

#### Parameters

##### namespaceName

`string`

##### thisClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getNamespaceWithNameFromClass()

> `static` **getNamespaceWithNameFromClass**(`namespaceName`, `startFrom`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/common/ModelUtils.ts:174

#### Parameters

##### namespaceName

`string`

##### startFrom

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getStaticMethodInFileWithName()

> `static` **getStaticMethodInFileWithName**(`methodName`, `arkFile`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/common/ModelUtils.ts:232

#### Parameters

##### methodName

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getStaticMethodInImportInfoWithName()

> `static` **getStaticMethodInImportInfoWithName**(`methodName`, `arkFile`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/common/ModelUtils.ts:243

#### Parameters

##### methodName

`string`

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getStaticMethodWithName()

> `static` **getStaticMethodWithName**(`methodName`, `thisClass`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/common/ModelUtils.ts:218

#### Parameters

##### methodName

`string`

##### thisClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### isArkUIBuilderMethod()

> `static` **isArkUIBuilderMethod**(`arkMethod`): `boolean`

Defined in: src/core/common/ModelUtils.ts:292

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`boolean`

***

### parseArkBaseModel2Type()

> `static` **parseArkBaseModel2Type**(`arkBaseModel`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/ModelUtils.ts:506

#### Parameters

##### arkBaseModel

`ArkBaseModel`

#### Returns

`null` \| [`Type`](Type.md)
