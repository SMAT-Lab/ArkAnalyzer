[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkNamespace

# Class: ArkNamespace

Defined in: src/core/model/ArkNamespace.ts:29

## Extends

- `ArkBaseModel`

## Implements

- `ArkExport`

## Constructors

### Constructor

> **new ArkNamespace**(): `ArkNamespace`

Defined in: src/core/model/ArkNamespace.ts:50

#### Returns

`ArkNamespace`

#### Overrides

`ArkBaseModel.constructor`

## Properties

### decorators?

> `protected` `optional` **decorators**: `Set`\<[`Decorator`](Decorator.md)\>

Defined in: src/core/model/ArkBaseModel.ts:115

#### Inherited from

`ArkBaseModel.decorators`

***

### metadata?

> `protected` `optional` **metadata**: `ArkMetadata`

Defined in: src/core/model/ArkBaseModel.ts:116

#### Inherited from

`ArkBaseModel.metadata`

***

### modifiers?

> `protected` `optional` **modifiers**: `number`

Defined in: src/core/model/ArkBaseModel.ts:114

#### Inherited from

`ArkBaseModel.modifiers`

## Methods

### addArkClass()

> **addArkClass**(`arkClass`): `void`

Defined in: src/core/model/ArkNamespace.ts:189

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### addCode()

> **addCode**(`sourceCode`): `void`

Defined in: src/core/model/ArkNamespace.ts:117

#### Parameters

##### sourceCode

`string`

#### Returns

`void`

***

### addDecorator()

> **addDecorator**(`decorator`): `void`

Defined in: src/core/model/ArkBaseModel.ts:215

#### Parameters

##### decorator

[`Decorator`](Decorator.md)

#### Returns

`void`

#### Inherited from

`ArkBaseModel.addDecorator`

***

### addExportInfo()

> **addExportInfo**(`exportInfo`): `void`

Defined in: src/core/model/ArkNamespace.ts:207

#### Parameters

##### exportInfo

[`ExportInfo`](ExportInfo.md)

#### Returns

`void`

***

### addModifier()

> **addModifier**(`modifier`): `void`

Defined in: src/core/model/ArkBaseModel.ts:142

#### Parameters

##### modifier

`number`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.addModifier`

***

### addNamespace()

> **addNamespace**(`namespace`): `void`

Defined in: src/core/model/ArkNamespace.ts:61

#### Parameters

##### namespace

`ArkNamespace`

#### Returns

`void`

***

### containsModifier()

> **containsModifier**(`modifierType`): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:194

#### Parameters

##### modifierType

`ModifierType`

#### Returns

`boolean`

#### Implementation of

`ArkExport.containsModifier`

#### Inherited from

`ArkBaseModel.containsModifier`

***

### getAllClassesUnderThisNamespace()

> **getAllClassesUnderThisNamespace**(): [`ArkClass`](ArkClass.md)[]

Defined in: src/core/model/ArkNamespace.ts:230

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getAllMethodsUnderThisNamespace()

> **getAllMethodsUnderThisNamespace**(): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/core/model/ArkNamespace.ts:219

#### Returns

[`ArkMethod`](ArkMethod.md)[]

***

### getAllNamespacesUnderThisNamespace()

> **getAllNamespacesUnderThisNamespace**(): `ArkNamespace`[]

Defined in: src/core/model/ArkNamespace.ts:239

#### Returns

`ArkNamespace`[]

***

### getAnonymousClassNumber()

> **getAnonymousClassNumber**(): `number`

Defined in: src/core/model/ArkNamespace.ts:248

#### Returns

`number`

***

### getClass()

> **getClass**(`classSignature`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkNamespace.ts:176

#### Parameters

##### classSignature

[`ClassSignature`](ClassSignature.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getClasses()

> **getClasses**(): [`ArkClass`](ArkClass.md)[]

Defined in: src/core/model/ArkNamespace.ts:185

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getClassWithName()

> **getClassWithName**(`Class`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkNamespace.ts:181

#### Parameters

##### Class

`string`

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getCode()

> **getCode**(): `string`

Defined in: src/core/model/ArkNamespace.ts:94

#### Returns

`string`

***

### getCodes()

> **getCodes**(): `string`[]

Defined in: src/core/model/ArkNamespace.ts:105

#### Returns

`string`[]

***

### getColumn()

> **getColumn**(): `number`

Defined in: src/core/model/ArkNamespace.ts:129

#### Returns

`number`

***

### getDeclaringArkFile()

> **getDeclaringArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/core/model/ArkNamespace.ts:160

#### Returns

[`ArkFile`](ArkFile.md)

***

### getDeclaringArkNamespace()

> **getDeclaringArkNamespace**(): `null` \| `ArkNamespace`

Defined in: src/core/model/ArkNamespace.ts:168

#### Returns

`null` \| `ArkNamespace`

***

### getDeclaringInstance()

> **getDeclaringInstance**(): [`ArkFile`](ArkFile.md) \| `ArkNamespace`

Defined in: src/core/model/ArkNamespace.ts:152

#### Returns

[`ArkFile`](ArkFile.md) \| `ArkNamespace`

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getDefaultClass()

> **getDefaultClass**(): [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkNamespace.ts:211

#### Returns

[`ArkClass`](ArkClass.md)

***

### getExportInfoBy()

> **getExportInfoBy**(`name`): `undefined` \| [`ExportInfo`](ExportInfo.md)

Defined in: src/core/model/ArkNamespace.ts:203

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`ExportInfo`](ExportInfo.md)

***

### getExportInfos()

> **getExportInfos**(): [`ExportInfo`](ExportInfo.md)[]

Defined in: src/core/model/ArkNamespace.ts:193

#### Returns

[`ExportInfo`](ExportInfo.md)[]

***

### getExportType()

> **getExportType**(): `ExportType`

Defined in: src/core/model/ArkNamespace.ts:252

#### Returns

`ExportType`

#### Implementation of

`ArkExport.getExportType`

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkNamespace.ts:57

Returns the program language of the file where this namespace defined.

#### Returns

`Language`

***

### getLine()

> **getLine**(): `number`

Defined in: src/core/model/ArkNamespace.ts:121

#### Returns

`number`

***

### getLineColPairs()

> **getLineColPairs**(): \[`number`, `number`\][]

Defined in: src/core/model/ArkNamespace.ts:137

#### Returns

\[`number`, `number`\][]

***

### getMetadata()

> **getMetadata**(`kind`): `undefined` \| `ArkMetadataType`

Defined in: src/core/model/ArkBaseModel.ts:118

#### Parameters

##### kind

`ArkMetadataKind`

#### Returns

`undefined` \| `ArkMetadataType`

#### Inherited from

`ArkBaseModel.getMetadata`

***

### getModifiers()

> **getModifiers**(): `number`

Defined in: src/core/model/ArkBaseModel.ts:129

#### Returns

`number`

#### Implementation of

`ArkExport.getModifiers`

#### Inherited from

`ArkBaseModel.getModifiers`

***

### getName()

> **getName**(): `string`

Defined in: src/core/model/ArkNamespace.ts:90

#### Returns

`string`

#### Implementation of

`ArkExport.getName`

***

### getNamespace()

> **getNamespace**(`namespaceSignature`): `null` \| `ArkNamespace`

Defined in: src/core/model/ArkNamespace.ts:65

#### Parameters

##### namespaceSignature

[`NamespaceSignature`](NamespaceSignature.md)

#### Returns

`null` \| `ArkNamespace`

***

### getNamespaces()

> **getNamespaces**(): `ArkNamespace`[]

Defined in: src/core/model/ArkNamespace.ts:74

#### Returns

`ArkNamespace`[]

***

### getNamespaceSignature()

> **getNamespaceSignature**(): [`NamespaceSignature`](NamespaceSignature.md)

Defined in: src/core/model/ArkNamespace.ts:86

#### Returns

[`NamespaceSignature`](NamespaceSignature.md)

***

### getNamespaceWithName()

> **getNamespaceWithName**(`namespaceName`): `null` \| `ArkNamespace`

Defined in: src/core/model/ArkNamespace.ts:70

#### Parameters

##### namespaceName

`string`

#### Returns

`null` \| `ArkNamespace`

***

### getSignature()

> **getSignature**(): [`NamespaceSignature`](NamespaceSignature.md)

Defined in: src/core/model/ArkNamespace.ts:82

#### Returns

[`NamespaceSignature`](NamespaceSignature.md)

#### Implementation of

`ArkExport.getSignature`

***

### getStateDecorators()

> **getStateDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:234

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getStateDecorators`

***

### hasBuilderDecorator()

> **hasBuilderDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:230

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasBuilderDecorator`

***

### hasBuilderParamDecorator()

> **hasBuilderParamDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:243

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasBuilderParamDecorator`

***

### hasComponentDecorator()

> **hasComponentDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:251

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasComponentDecorator`

***

### hasDecorator()

> **hasDecorator**(`kind`): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:255

#### Parameters

##### kind

`string` | `Set`\<`string`\>

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasDecorator`

***

### hasEntryDecorator()

> **hasEntryDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:247

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasEntryDecorator`

***

### isAbstract()

> **isAbstract**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:173

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isAbstract`

***

### isDeclare()

> **isDeclare**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:190

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isDeclare`

***

### isDefault()

> **isDefault**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:181

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isDefault`

***

### isExport()

> **isExport**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:177

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isExport`

***

### ~~isExported()~~

> **isExported**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:186

#### Returns

`boolean`

#### Deprecated

Use [isExport](#isexport) instead.

#### Inherited from

`ArkBaseModel.isExported`

***

### isPrivate()

> **isPrivate**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:161

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isPrivate`

***

### isProtected()

> **isProtected**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:157

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isProtected`

***

### isPublic()

> **isPublic**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:165

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isPublic`

***

### isReadonly()

> **isReadonly**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:169

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isReadonly`

***

### isStatic()

> **isStatic**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:153

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isStatic`

***

### removeArkClass()

> **removeArkClass**(`arkClass`): `boolean`

Defined in: src/core/model/ArkNamespace.ts:256

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`boolean`

***

### removeDecorator()

> **removeDecorator**(`kind`): `void`

Defined in: src/core/model/ArkBaseModel.ts:222

#### Parameters

##### kind

`string`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.removeDecorator`

***

### removeModifier()

> **removeModifier**(`modifier`): `void`

Defined in: src/core/model/ArkBaseModel.ts:146

#### Parameters

##### modifier

`ModifierType`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.removeModifier`

***

### removeNamespace()

> **removeNamespace**(`namespace`): `boolean`

Defined in: src/core/model/ArkNamespace.ts:262

#### Parameters

##### namespace

`ArkNamespace`

#### Returns

`boolean`

***

### setCode()

> **setCode**(`sourceCode`): `void`

Defined in: src/core/model/ArkNamespace.ts:98

#### Parameters

##### sourceCode

`string`

#### Returns

`void`

***

### setCodes()

> **setCodes**(`sourceCodes`): `void`

Defined in: src/core/model/ArkNamespace.ts:112

#### Parameters

##### sourceCodes

`string`[]

#### Returns

`void`

***

### setColumn()

> **setColumn**(`column`): `void`

Defined in: src/core/model/ArkNamespace.ts:133

#### Parameters

##### column

`number`

#### Returns

`void`

***

### setDeclaringArkFile()

> **setDeclaringArkFile**(`declaringArkFile`): `void`

Defined in: src/core/model/ArkNamespace.ts:164

#### Parameters

##### declaringArkFile

[`ArkFile`](ArkFile.md)

#### Returns

`void`

***

### setDeclaringArkNamespace()

> **setDeclaringArkNamespace**(`declaringArkNamespace`): `void`

Defined in: src/core/model/ArkNamespace.ts:172

#### Parameters

##### declaringArkNamespace

`ArkNamespace`

#### Returns

`void`

***

### setDeclaringInstance()

> **setDeclaringInstance**(`declaringInstance`): `void`

Defined in: src/core/model/ArkNamespace.ts:156

#### Parameters

##### declaringInstance

[`ArkFile`](ArkFile.md) | `ArkNamespace`

#### Returns

`void`

***

### setDecorators()

> **setDecorators**(`decorators`): `void`

Defined in: src/core/model/ArkBaseModel.ts:209

#### Parameters

##### decorators

`Set`\<[`Decorator`](Decorator.md)\>

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setDecorators`

***

### setDefaultClass()

> **setDefaultClass**(`defaultClass`): `void`

Defined in: src/core/model/ArkNamespace.ts:215

#### Parameters

##### defaultClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### setLine()

> **setLine**(`line`): `void`

Defined in: src/core/model/ArkNamespace.ts:125

#### Parameters

##### line

`number`

#### Returns

`void`

***

### setLineCols()

> **setLineCols**(`lineColPairs`): `void`

Defined in: src/core/model/ArkNamespace.ts:145

#### Parameters

##### lineColPairs

\[`number`, `number`\][]

#### Returns

`void`

***

### setMetadata()

> **setMetadata**(`kind`, `value`): `void`

Defined in: src/core/model/ArkBaseModel.ts:122

#### Parameters

##### kind

`ArkMetadataKind`

##### value

`ArkMetadataType`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setMetadata`

***

### setModifiers()

> **setModifiers**(`modifiers`): `void`

Defined in: src/core/model/ArkBaseModel.ts:136

#### Parameters

##### modifiers

`number`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setModifiers`

***

### setSignature()

> **setSignature**(`namespaceSignature`): `void`

Defined in: src/core/model/ArkNamespace.ts:78

#### Parameters

##### namespaceSignature

[`NamespaceSignature`](NamespaceSignature.md)

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkNamespace.ts:268

#### Returns

`ArkError`

#### Overrides

`ArkBaseModel.validate`

***

### validateFields()

> `protected` **validateFields**(`fields`): `ArkError`

Defined in: src/core/model/ArkBaseModel.ts:267

#### Parameters

##### fields

`string`[]

#### Returns

`ArkError`

#### Inherited from

`ArkBaseModel.validateFields`
