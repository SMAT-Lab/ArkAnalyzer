[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ImportInfo

# Class: ImportInfo

Defined in: src/core/model/ArkImport.ts:26

## Extends

- `ArkBaseModel`

## Implements

- `FromInfo`

## Constructors

### Constructor

> **new ImportInfo**(): `ImportInfo`

Defined in: src/core/model/ArkImport.ts:37

#### Returns

`ImportInfo`

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

### build()

> **build**(`importClauseName`, `importType`, `importFrom`, `originTsPosition`, `modifiers`, `nameBeforeAs?`): `void`

Defined in: src/core/model/ArkImport.ts:48

#### Parameters

##### importClauseName

`string`

##### importType

`string`

##### importFrom

`string`

##### originTsPosition

[`LineColPosition`](LineColPosition.md)

##### modifiers

`number`

##### nameBeforeAs?

`string`

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

#### Inherited from

`ArkBaseModel.containsModifier`

***

### getDeclaringArkFile()

> **getDeclaringArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/core/model/ArkImport.ts:85

#### Returns

[`ArkFile`](ArkFile.md)

#### Implementation of

`FromInfo.getDeclaringArkFile`

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getFrom()

> **getFrom**(): `undefined` \| `string`

Defined in: src/core/model/ArkImport.ts:133

#### Returns

`undefined` \| `string`

#### Implementation of

`FromInfo.getFrom`

***

### getImportClauseName()

> **getImportClauseName**(): `string`

Defined in: src/core/model/ArkImport.ts:89

#### Returns

`string`

***

### getImportType()

> **getImportType**(): `string`

Defined in: src/core/model/ArkImport.ts:97

#### Returns

`string`

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkImport.ts:44

Returns the program language of the file where this import info defined.

#### Returns

`Language`

***

### getLazyExportInfo()

> **getLazyExportInfo**(): `null` \| [`ExportInfo`](ExportInfo.md)

Defined in: src/core/model/ArkImport.ts:74

Returns the export information, i.e., the actual reference generated at the time of call.
The export information includes: clause's name, clause's type, modifiers, location
where it is exported from, etc. If the export information could not be found, **null** will be returned.

#### Returns

`null` \| [`ExportInfo`](ExportInfo.md)

The export information. If there is no export information, the return will be a **null**.

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

Defined in: src/core/model/ArkImport.ts:109

#### Returns

`undefined` \| `string`

***

### getOriginName()

> **getOriginName**(): `string`

Defined in: src/core/model/ArkImport.ts:64

#### Returns

`string`

#### Implementation of

`FromInfo.getOriginName`

***

### getOriginTsPosition()

> **getOriginTsPosition**(): [`LineColPosition`](LineColPosition.md)

Defined in: src/core/model/ArkImport.ts:121

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

Defined in: src/core/model/ArkImport.ts:129

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

Defined in: src/core/model/ArkImport.ts:137

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

### setDeclaringArkFile()

> **setDeclaringArkFile**(`declaringArkFile`): `void`

Defined in: src/core/model/ArkImport.ts:81

#### Parameters

##### declaringArkFile

[`ArkFile`](ArkFile.md)

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

### setImportClauseName()

> **setImportClauseName**(`importClauseName`): `void`

Defined in: src/core/model/ArkImport.ts:93

#### Parameters

##### importClauseName

`string`

#### Returns

`void`

***

### setImportFrom()

> **setImportFrom**(`importFrom`): `void`

Defined in: src/core/model/ArkImport.ts:105

#### Parameters

##### importFrom

`string`

#### Returns

`void`

***

### setImportType()

> **setImportType**(`importType`): `void`

Defined in: src/core/model/ArkImport.ts:101

#### Parameters

##### importType

`string`

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

### setNameBeforeAs()

> **setNameBeforeAs**(`nameBeforeAs`): `void`

Defined in: src/core/model/ArkImport.ts:113

#### Parameters

##### nameBeforeAs

`undefined` | `string`

#### Returns

`void`

***

### setOriginTsPosition()

> **setOriginTsPosition**(`originTsPosition`): `void`

Defined in: src/core/model/ArkImport.ts:117

#### Parameters

##### originTsPosition

[`LineColPosition`](LineColPosition.md)

#### Returns

`void`

***

### setTsSourceCode()

> **setTsSourceCode**(`tsSourceCode`): `void`

Defined in: src/core/model/ArkImport.ts:125

#### Parameters

##### tsSourceCode

`string`

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkImport.ts:144

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
