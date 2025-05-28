[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ExportInfo

# Class: ExportInfo

Defined in: src/core/model/ArkExport.ts:58

## Extends

- `ArkBaseModel`

## Implements

- `FromInfo`

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

***

### Builder

> `static` **Builder**: *typeof* `ArkExportBuilder`

Defined in: src/core/model/ArkExport.ts:140

## Methods

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

### containsModifier()

> **containsModifier**(`modifierType`): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:194

#### Parameters

##### modifierType

`ModifierType`

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.containsModifier`

***

### getArkExport()

> **getArkExport**(): `undefined` \| `null` \| `ArkExport`

Defined in: src/core/model/ArkExport.ts:110

#### Returns

`undefined` \| `null` \| `ArkExport`

***

### getDeclaringArkFile()

> **getDeclaringArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/core/model/ArkExport.ts:132

#### Returns

[`ArkFile`](ArkFile.md)

#### Implementation of

`FromInfo.getDeclaringArkFile`

***

### getDeclaringArkNamespace()

> **getDeclaringArkNamespace**(): `undefined` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/model/ArkExport.ts:136

#### Returns

`undefined` \| [`ArkNamespace`](ArkNamespace.md)

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getExportClauseName()

> **getExportClauseName**(): `string`

Defined in: src/core/model/ArkExport.ts:90

#### Returns

`string`

***

### getExportClauseType()

> **getExportClauseType**(): `ExportType`

Defined in: src/core/model/ArkExport.ts:98

#### Returns

`ExportType`

***

### getFrom()

> **getFrom**(): `undefined` \| `string`

Defined in: src/core/model/ArkExport.ts:82

#### Returns

`undefined` \| `string`

#### Implementation of

`FromInfo.getFrom`

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkExport.ts:78

Returns the program language of the file where this export info defined.

#### Returns

`Language`

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

#### Inherited from

`ArkBaseModel.getModifiers`

***

### getNameBeforeAs()

> **getNameBeforeAs**(): `undefined` \| `string`

Defined in: src/core/model/ArkExport.ts:102

#### Returns

`undefined` \| `string`

***

### getOriginName()

> **getOriginName**(): `string`

Defined in: src/core/model/ArkExport.ts:86

#### Returns

`string`

#### Implementation of

`FromInfo.getOriginName`

***

### getOriginTsPosition()

> **getOriginTsPosition**(): [`LineColPosition`](LineColPosition.md)

Defined in: src/core/model/ArkExport.ts:124

#### Returns

[`LineColPosition`](LineColPosition.md)

***

### getStateDecorators()

> **getStateDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:234

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getStateDecorators`

***

### getTsSourceCode()

> **getTsSourceCode**(): `string`

Defined in: src/core/model/ArkExport.ts:128

#### Returns

`string`

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

Defined in: src/core/model/ArkExport.ts:114

#### Returns

`boolean`

#### Implementation of

`FromInfo.isDefault`

#### Overrides

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

Use [isExport](ArkNamespace.md#isexport) instead.

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

### setArkExport()

> **setArkExport**(`value`): `void`

Defined in: src/core/model/ArkExport.ts:106

#### Parameters

##### value

`null` | `ArkExport`

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

### setExportClauseType()

> **setExportClauseType**(`exportClauseType`): `void`

Defined in: src/core/model/ArkExport.ts:94

#### Parameters

##### exportClauseType

`ExportType`

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

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkExport.ts:214

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
