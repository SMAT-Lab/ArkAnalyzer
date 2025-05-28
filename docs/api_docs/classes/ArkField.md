[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkField

# Class: ArkField

Defined in: src/core/model/ArkField.ts:40

## Extends

- `ArkBaseModel`

## Constructors

### Constructor

> **new ArkField**(): `ArkField`

Defined in: src/core/model/ArkField.ts:53

#### Returns

`ArkField`

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

### getCategory()

> **getCategory**(): `FieldCategory`

Defined in: src/core/model/ArkField.ts:84

#### Returns

`FieldCategory`

***

### getCode()

> **getCode**(): `string`

Defined in: src/core/model/ArkField.ts:76

Returns the codes of field as a **string.**

#### Returns

`string`

the codes of field.

***

### getDeclaringArkClass()

> **getDeclaringArkClass**(): [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkField.ts:64

#### Returns

[`ArkClass`](ArkClass.md)

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getExclamationToken()

> **getExclamationToken**(): `boolean`

Defined in: src/core/model/ArkField.ts:132

#### Returns

`boolean`

***

### getInitializer()

> **getInitializer**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/model/ArkField.ts:112

Returns an array of statements used for initialization.

#### Returns

[`Stmt`](Stmt.md)[]

An array of statements used for initialization.

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkField.ts:60

Returns the program language of the file where this field's class defined.

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

### getName()

> **getName**(): `string`

Defined in: src/core/model/ArkField.ts:92

#### Returns

`string`

***

### getOriginPosition()

> **getOriginPosition**(): [`LineColPosition`](LineColPosition.md)

Defined in: src/core/model/ArkField.ts:144

Returns the original position of the field at source code.

#### Returns

[`LineColPosition`](LineColPosition.md)

The original position of the field at source code.

***

### getQuestionToken()

> **getQuestionToken**(): `boolean`

Defined in: src/core/model/ArkField.ts:128

#### Returns

`boolean`

***

### getSignature()

> **getSignature**(): [`FieldSignature`](FieldSignature.md)

Defined in: src/core/model/ArkField.ts:100

#### Returns

[`FieldSignature`](FieldSignature.md)

***

### getStateDecorators()

> **getStateDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:234

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getStateDecorators`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/model/ArkField.ts:96

#### Returns

[`Type`](Type.md)

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

Defined in: src/core/model/ArkField.ts:153

#### Returns

`boolean`

#### Overrides

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

### setCategory()

> **setCategory**(`category`): `void`

Defined in: src/core/model/ArkField.ts:88

#### Parameters

##### category

`FieldCategory`

#### Returns

`void`

***

### setCode()

> **setCode**(`code`): `void`

Defined in: src/core/model/ArkField.ts:80

#### Parameters

##### code

`string`

#### Returns

`void`

***

### setDeclaringArkClass()

> **setDeclaringArkClass**(`declaringClass`): `void`

Defined in: src/core/model/ArkField.ts:68

#### Parameters

##### declaringClass

[`ArkClass`](ArkClass.md)

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

### setExclamationToken()

> **setExclamationToken**(`exclamationToken`): `void`

Defined in: src/core/model/ArkField.ts:124

#### Parameters

##### exclamationToken

`boolean`

#### Returns

`void`

***

### setInitializer()

> **setInitializer**(`initializer`): `void`

Defined in: src/core/model/ArkField.ts:116

#### Parameters

##### initializer

[`Stmt`](Stmt.md)[]

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

### setOriginPosition()

> **setOriginPosition**(`position`): `void`

Defined in: src/core/model/ArkField.ts:136

#### Parameters

##### position

[`LineColPosition`](LineColPosition.md)

#### Returns

`void`

***

### setQuestionToken()

> **setQuestionToken**(`questionToken`): `void`

Defined in: src/core/model/ArkField.ts:120

#### Parameters

##### questionToken

`boolean`

#### Returns

`void`

***

### setSignature()

> **setSignature**(`fieldSig`): `void`

Defined in: src/core/model/ArkField.ts:104

#### Parameters

##### fieldSig

[`FieldSignature`](FieldSignature.md)

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkField.ts:148

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
