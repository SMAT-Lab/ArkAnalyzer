[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / TypeInference

# Class: TypeInference

Defined in: src/core/common/TypeInference.ts:90

## Constructors

### Constructor

> **new TypeInference**(): `TypeInference`

#### Returns

`TypeInference`

## Methods

### buildTypeFromStr()

> `static` **buildTypeFromStr**(`typeStr`): [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:469

#### Parameters

##### typeStr

`string`

#### Returns

[`Type`](Type.md)

***

### inferBaseType()

> `static` **inferBaseType**(`baseName`, `arkClass`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:745

Find out the original object and type for a given base name.
It returns original type.
The original type is null if failed to infer the type.

#### Parameters

##### baseName

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### inferDynamicImportType()

> `static` **inferDynamicImportType**(`from`, `arkClass`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:797

#### Parameters

##### from

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### inferFieldType()

> `static` **inferFieldType**(`baseType`, `fieldName`, `declareClass`): `null` \| \[`any`, [`Type`](Type.md)\]

Defined in: src/core/common/TypeInference.ts:673

Find out the original object and type for a given base type and the field name.
It returns an array with 2 items, original object and original type.
The original object is null if there is no object, or it failed to find the object.
The original type is null if it failed to infer the type.

#### Parameters

##### baseType

[`Type`](Type.md)

##### fieldName

`string`

##### declareClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| \[`any`, [`Type`](Type.md)\]

***

### inferFunctionType()

> `static` **inferFunctionType**(`argType`, `paramSubSignature`, `realTypes`): `void`

Defined in: src/core/common/TypeInference.ts:864

#### Parameters

##### argType

[`FunctionType`](FunctionType.md)

##### paramSubSignature

`undefined` | [`MethodSubSignature`](MethodSubSignature.md)

##### realTypes

`undefined` | [`Type`](Type.md)[]

#### Returns

`void`

***

### inferGenericType()

> `static` **inferGenericType**(`types`, `arkClass`): `void`

Defined in: src/core/common/TypeInference.ts:582

#### Parameters

##### types

`undefined` | [`GenericType`](GenericType.md)[]

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### inferParameterType()

> `static` **inferParameterType**(`param`, `arkMethod`): `void`

Defined in: src/core/common/TypeInference.ts:508

#### Parameters

##### param

`MethodParameter`

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### inferRealGenericTypes()

> `static` **inferRealGenericTypes**(`realTypes`, `arkClass`): `void`

Defined in: src/core/common/TypeInference.ts:782

#### Parameters

##### realTypes

`undefined` | [`Type`](Type.md)[]

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### inferSignatureReturnType()

> `static` **inferSignatureReturnType**(`oldSignature`, `arkMethod`): `void`

Defined in: src/core/common/TypeInference.ts:524

#### Parameters

##### oldSignature

[`MethodSignature`](MethodSignature.md)

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### inferSimpleTypeInMethod()

> `static` **inferSimpleTypeInMethod**(`arkMethod`): `void`

Defined in: src/core/common/TypeInference.ts:229

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

#### Deprecated

***

### inferSimpleTypeInStmt()

> `static` **inferSimpleTypeInStmt**(`stmt`): `void`

Defined in: src/core/common/TypeInference.ts:455

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### inferTypeByName()

> `static` **inferTypeByName**(`typeName`, `arkClass`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:767

#### Parameters

##### typeName

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### inferTypeInArkField()

> `static` **inferTypeInArkField**(`arkField`): `void`

Defined in: src/core/common/TypeInference.ts:91

#### Parameters

##### arkField

[`ArkField`](ArkField.md)

#### Returns

`void`

***

### inferTypeInMethod()

> `static` **inferTypeInMethod**(`arkMethod`): `void`

Defined in: src/core/common/TypeInference.ts:174

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### inferUnclearedType()

> `static` **inferUnclearedType**(`leftOpType`, `declaringArkClass`, `visited`): `undefined` \| `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:136

Infer type for a given unclear type.
It returns an array with 2 items, original object and original type.
The original object is null if there is no object, or it failed to find the object.
The original type is null if failed to infer the type.

#### Parameters

##### leftOpType

[`Type`](Type.md)

##### declaringArkClass

[`ArkClass`](ArkClass.md)

##### visited

`Set`\<[`Type`](Type.md)\> = `...`

#### Returns

`undefined` \| `null` \| [`Type`](Type.md)

***

### inferUnclearRefName()

> `static` **inferUnclearRefName**(`refName`, `arkClass`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:627

Find out the original object and type for a given unclear reference type name.
It returns original type.
The original type is null if it failed to infer the type.

#### Parameters

##### refName

`string`

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### inferUnclearRefType()

> `static` **inferUnclearRefType**(`urType`, `arkClass`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:609

Infer type for a given [UnclearReferenceType](UnclearReferenceType.md) type.
It returns original type.
The original type is null if it failed to infer the type.

#### Parameters

##### urType

[`UnclearReferenceType`](UnclearReferenceType.md)

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### inferValueType()

> `static` **inferValueType**(`value`, `arkMethod`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:498

#### Parameters

##### value

[`Value`](../interfaces/Value.md)

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`null` \| [`Type`](Type.md)

***

### isUnclearType()

> `static` **isUnclearType**(`type`): `boolean`

Defined in: src/core/common/TypeInference.ts:404

#### Parameters

##### type

`undefined` | `null` | [`Type`](Type.md)

#### Returns

`boolean`

***

### parseArkExport2Type()

> `static` **parseArkExport2Type**(`arkExport`): `null` \| [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:312

#### Parameters

##### arkExport

`undefined` | `null` | `ArkExport`

#### Returns

`null` \| [`Type`](Type.md)

***

### replaceAliasType()

> `static` **replaceAliasType**(`type`): [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:856

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Type`](Type.md)

***

### replaceRecursiveType()

> `static` **replaceRecursiveType**(`type`, `visited`, `realTypes?`): [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:822

#### Parameters

##### type

[`Type`](Type.md)

##### visited

`Set`\<[`Type`](Type.md)\>

##### realTypes?

[`Type`](Type.md)[]

#### Returns

[`Type`](Type.md)

***

### replaceTypeWithReal()

> `static` **replaceTypeWithReal**(`type`, `realTypes?`, `visited?`): [`Type`](Type.md)

Defined in: src/core/common/TypeInference.ts:806

#### Parameters

##### type

[`Type`](Type.md)

##### realTypes?

[`Type`](Type.md)[]

##### visited?

`Set`\<[`Type`](Type.md)\> = `...`

#### Returns

[`Type`](Type.md)

***

### resolveArkAssignStmt()

> `static` **resolveArkAssignStmt**(`stmt`, `arkMethod`): `void`

Defined in: src/core/common/TypeInference.ts:339

infer and pass type for ArkAssignStmt right and left

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`
