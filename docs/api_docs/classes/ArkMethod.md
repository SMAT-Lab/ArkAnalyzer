[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkMethod

# Class: ArkMethod

Defined in: src/core/model/ArkMethod.ts:64

## Extends

- `ArkBaseModel`

## Implements

- `ArkExport`

## Constructors

### Constructor

> **new ArkMethod**(): `ArkMethod`

Defined in: src/core/model/ArkMethod.ts:87

#### Returns

`ArkMethod`

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

### buildBody()

> **buildBody**(): `void`

Defined in: src/core/model/ArkMethod.ts:563

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

### freeBodyBuilder()

> **freeBodyBuilder**(): `void`

Defined in: src/core/model/ArkMethod.ts:559

#### Returns

`void`

***

### getAsteriskToken()

> **getAsteriskToken**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:584

#### Returns

`boolean`

***

### getBody()

> **getBody**(): `undefined` \| [`ArkBody`](ArkBody.md)

Defined in: src/core/model/ArkMethod.ts:417

Get [ArkBody](ArkBody.md) of a Method.
A [ArkBody](ArkBody.md) contains the CFG and actual instructions or operations to be executed for a method.
It is analogous to the body of a function or method in high-level programming languages,
which contains the statements and expressions that define what the function does.

#### Returns

`undefined` \| [`ArkBody`](ArkBody.md)

The [ArkBody](ArkBody.md) of a method.

#### Example

1. Get cfg or stmt through ArkBody.

```typescript
let cfg = this.scene.getMethod()?.getBody().getCfg();
const body = arkMethod.getBody()
```

2. Get local variable through ArkBody.

```typescript
arkClass.getDefaultArkMethod()?.getBody().getLocals.forEach(local=>{...})
let locals = arkFile().getDefaultClass().getDefaultArkMethod()?.getBody()?.getLocals();
```

***

### getBodyBuilder()

> **getBodyBuilder**(): `undefined` \| `BodyBuilder`

Defined in: src/core/model/ArkMethod.ts:392

#### Returns

`undefined` \| `BodyBuilder`

***

### getCfg()

> **getCfg**(): `undefined` \| [`Cfg`](Cfg.md)

Defined in: src/core/model/ArkMethod.ts:460

Get the CFG (i.e., control flow graph) of a method.
The CFG is a graphical representation of all possible control flow paths within a method's body.
A CFG consists of blocks, statements and goto control jumps.

#### Returns

`undefined` \| [`Cfg`](Cfg.md)

The CFG (i.e., control flow graph) of a method.

#### Example

1. get stmt through ArkBody cfg.

```typescript
body = arkMethod.getBody();
const cfg = body.getCfg();
for (const threeAddressStmt of cfg.getStmts()) {
... ...
}
```

2. get blocks through ArkBody cfg.

```typescript
const body = arkMethod.getBody();
const blocks = [...body.getCfg().getBlocks()];
for (let i=0; i<blocks.length; i++) {
const block = blocks[i];
... ...
for (const stmt of block.getStmts()) {
... ...
}
let text = "next;"
for (const next of block.getSuccessors()) {
text += blocks.indexOf(next) + ' ';
}
// ... ...
}
```

***

### getCode()

> **getCode**(): `undefined` \| `string`

Defined in: src/core/model/ArkMethod.ts:110

Returns the codes of method as a **string.**

#### Returns

`undefined` \| `string`

the codes of method.

***

### getColumn()

> **getColumn**(): `null` \| `number`

Defined in: src/core/model/ArkMethod.ts:213

Get column of the method's implementation or null if the method has no implementation.

#### Returns

`null` \| `number`

null or the number of the column.

***

### getDeclareColumns()

> **getDeclareColumns**(): `null` \| `number`[]

Defined in: src/core/model/ArkMethod.ts:137

Get all columns of the method's declarations or null if the method has no seperated declaration.

#### Returns

`null` \| `number`[]

null or the columns of the method's declarations with number type.

***

### getDeclareLineCols()

> **getDeclareLineCols**(): `null` \| `number`[]

Defined in: src/core/model/ArkMethod.ts:181

Get encoded lines and columns of the method's declarations or null if the method has no seperated declaration.

#### Returns

`null` \| `number`[]

null or the encoded lines and columns of the method's declarations with LineCol type.

***

### getDeclareLines()

> **getDeclareLines**(): `null` \| `number`[]

Defined in: src/core/model/ArkMethod.ts:122

Get all lines of the method's declarations or null if the method has no seperated declaration.

#### Returns

`null` \| `number`[]

null or the lines of the method's declarations with number type.

***

### getDeclareSignatureIndex()

> **getDeclareSignatureIndex**(`targetSignature`): `number`

Defined in: src/core/model/ArkMethod.ts:297

Get the index of the matched method declare signature among all declare signatures.
The index will be -1 if there is no matched signature found.

#### Parameters

##### targetSignature

[`MethodSignature`](MethodSignature.md)

the target declare signature want to search.

#### Returns

`number`

-1 or the index of the matched signature.

***

### getDeclareSignatures()

> **getDeclareSignatures**(): `null` \| [`MethodSignature`](MethodSignature.md)[]

Defined in: src/core/model/ArkMethod.ts:287

Get all declare signatures.
The results could be null if there is no seperated declaration of the method.

#### Returns

`null` \| [`MethodSignature`](MethodSignature.md)[]

null or the method declare signatures.

***

### getDeclaringArkClass()

> **getDeclaringArkClass**(): [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkMethod.ts:254

Returns the declaring class of the method.

#### Returns

[`ArkClass`](ArkClass.md)

The declaring class of the method.

***

### getDeclaringArkFile()

> **getDeclaringArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/core/model/ArkMethod.ts:262

#### Returns

[`ArkFile`](ArkFile.md)

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getExportType()

> **getExportType**(): `ExportType`

Defined in: src/core/model/ArkMethod.ts:98

#### Returns

`ExportType`

#### Implementation of

`ArkExport.getExportType`

***

### getFunctionLocal()

> **getFunctionLocal**(`name`): `null` \| [`Local`](Local.md)

Defined in: src/core/model/ArkMethod.ts:713

#### Parameters

##### name

`string`

#### Returns

`null` \| [`Local`](Local.md)

***

### getGenericTypes()

> **getGenericTypes**(): `undefined` \| [`GenericType`](GenericType.md)[]

Defined in: src/core/model/ArkMethod.ts:380

#### Returns

`undefined` \| [`GenericType`](GenericType.md)[]

***

### getImplementationSignature()

> **getImplementationSignature**(): `null` \| [`MethodSignature`](MethodSignature.md)

Defined in: src/core/model/ArkMethod.ts:315

Get the method signature of the implementation.
The signature could be null if the method is only a declaration which body is undefined.

#### Returns

`null` \| [`MethodSignature`](MethodSignature.md)

null or the method implementation signature.

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkMethod.ts:94

Returns the program language of the file where this method defined.

#### Returns

`Language`

***

### getLine()

> **getLine**(): `null` \| `number`

Defined in: src/core/model/ArkMethod.ts:189

Get line of the method's implementation or null if the method has no implementation.

#### Returns

`null` \| `number`

null or the number of the line.

***

### getLineCol()

> **getLineCol**(): `null` \| `number`

Defined in: src/core/model/ArkMethod.ts:237

Get encoded line and column of the method's implementation or null if the method has no implementation.

#### Returns

`null` \| `number`

null or the encoded line and column of the method's implementation with LineCol type.

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

Defined in: src/core/model/ArkMethod.ts:102

#### Returns

`string`

#### Implementation of

`ArkExport.getName`

***

### getOriginalCfg()

> **getOriginalCfg**(): `undefined` \| [`Cfg`](Cfg.md)

Defined in: src/core/model/ArkMethod.ts:464

#### Returns

`undefined` \| [`Cfg`](Cfg.md)

***

### getOuterMethod()

> **getOuterMethod**(): `undefined` \| `ArkMethod`

Defined in: src/core/model/ArkMethod.ts:705

#### Returns

`undefined` \| `ArkMethod`

***

### getParameterInstances()

> **getParameterInstances**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/model/ArkMethod.ts:483

#### Returns

[`Value`](../interfaces/Value.md)[]

***

### getParameterRefs()

> **getParameterRefs**(): `null` \| [`ArkParameterRef`](ArkParameterRef.md)[]

Defined in: src/core/model/ArkMethod.ts:468

#### Returns

`null` \| [`ArkParameterRef`](ArkParameterRef.md)[]

***

### getParameters()

> **getParameters**(): `MethodParameter`[]

Defined in: src/core/model/ArkMethod.ts:274

#### Returns

`MethodParameter`[]

***

### getQuestionToken()

> **getQuestionToken**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:722

#### Returns

`boolean`

***

### getReturnStmt()

> **getReturnStmt**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/model/ArkMethod.ts:534

#### Returns

[`Stmt`](Stmt.md)[]

***

### getReturnType()

> **getReturnType**(): [`Type`](Type.md)

Defined in: src/core/model/ArkMethod.ts:278

#### Returns

[`Type`](Type.md)

***

### getReturnValues()

> **getReturnValues**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/model/ArkMethod.ts:521

#### Returns

[`Value`](../interfaces/Value.md)[]

***

### getSignature()

> **getSignature**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/model/ArkMethod.ts:334

Get the method signature of the implementation or the first declaration if there is no implementation.
For a method, the implementation and declaration signatures must not be undefined at the same time.
A [MethodSignature](MethodSignature.md) includes:
- Class Signature: indicates which class this method belong to.
- Method SubSignature: indicates the detail info of this method such as method name, parameters, returnType, etc.

#### Returns

[`MethodSignature`](MethodSignature.md)

The method signature.

#### Example

1. Get the signature of method mtd.

```typescript
let signature = mtd.getSignature();
// ... ...
```

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

### getSubSignature()

> **getSubSignature**(): [`MethodSubSignature`](MethodSubSignature.md)

Defined in: src/core/model/ArkMethod.ts:376

#### Returns

[`MethodSubSignature`](MethodSubSignature.md)

***

### getThisInstance()

> **getThisInstance**(): `null` \| [`Value`](../interfaces/Value.md)

Defined in: src/core/model/ArkMethod.ts:504

#### Returns

`null` \| [`Value`](../interfaces/Value.md)

***

### getViewTree()

> **getViewTree**(): `undefined` \| [`ViewTree`](../interfaces/ViewTree.md)

Defined in: src/core/model/ArkMethod.ts:544

#### Returns

`undefined` \| [`ViewTree`](../interfaces/ViewTree.md)

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

### hasViewTree()

> **hasViewTree**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:548

#### Returns

`boolean`

***

### isAbstract()

> **isAbstract**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:173

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isAbstract`

***

### isAnonymousMethod()

> **isAnonymousMethod**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:270

#### Returns

`boolean`

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

### isDefaultArkMethod()

> **isDefaultArkMethod**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:266

#### Returns

`boolean`

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

### isGenerated()

> **isGenerated**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:576

#### Returns

`boolean`

***

### isGenericsMethod()

> **isGenericsMethod**(): `boolean`

Defined in: src/core/model/ArkMethod.ts:384

#### Returns

`boolean`

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

Defined in: src/core/model/ArkMethod.ts:727

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

### matchMethodSignature()

> **matchMethodSignature**(`args`): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/model/ArkMethod.ts:625

#### Parameters

##### args

[`Value`](../interfaces/Value.md)[]

#### Returns

[`MethodSignature`](MethodSignature.md)

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

### setAsteriskToken()

> **setAsteriskToken**(`asteriskToken`): `void`

Defined in: src/core/model/ArkMethod.ts:588

#### Parameters

##### asteriskToken

`boolean`

#### Returns

`void`

***

### setBody()

> **setBody**(`body`): `void`

Defined in: src/core/model/ArkMethod.ts:421

#### Parameters

##### body

[`ArkBody`](ArkBody.md)

#### Returns

`void`

***

### setBodyBuilder()

> **setBodyBuilder**(`bodyBuilder`): `void`

Defined in: src/core/model/ArkMethod.ts:552

#### Parameters

##### bodyBuilder

`BodyBuilder`

#### Returns

`void`

***

### setCode()

> **setCode**(`code`): `void`

Defined in: src/core/model/ArkMethod.ts:114

#### Parameters

##### code

`string`

#### Returns

`void`

***

### setColumn()

> **setColumn**(`column`): `void`

Defined in: src/core/model/ArkMethod.ts:226

Set column of the implementation with column number input.
The column number will be encoded together with the original line number.

#### Parameters

##### column

`number`

the column number of the method implementation.

#### Returns

`void`

***

### setDeclareLineCols()

> **setDeclareLineCols**(`lineCols`): `void`

Defined in: src/core/model/ArkMethod.ts:173

Set lineCols of the declarations directly with LineCol type input.

#### Parameters

##### lineCols

`number`[]

the encoded lines and columns with LineCol type.

#### Returns

`void`

***

### setDeclareLinesAndCols()

> **setDeclareLinesAndCols**(`lines`, `columns`): `void`

Defined in: src/core/model/ArkMethod.ts:155

Set lines and columns of the declarations with number type inputs and then encoded them to LineCol type.
The length of lines and columns should be the same otherwise they cannot be encoded together.

#### Parameters

##### lines

`number`[]

the number of lines.

##### columns

`number`[]

the number of columns.

#### Returns

`void`

***

### setDeclareSignatures()

> **setDeclareSignatures**(`signatures`): `void`

Defined in: src/core/model/ArkMethod.ts:344

Set signatures of all declarations.
It will reset the declaration signatures if they are already defined before.

#### Parameters

##### signatures

one signature or a list of signatures.

[`MethodSignature`](MethodSignature.md) | [`MethodSignature`](MethodSignature.md)[]

#### Returns

`void`

***

### setDeclareSignatureWithIndex()

> **setDeclareSignatureWithIndex**(`signature`, `index`): `void`

Defined in: src/core/model/ArkMethod.ts:359

Reset signature of one declaration with the specified index.
Will do nothing if the index doesn't exist.

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

new signature want to set.

##### index

`number`

index of signature want to set.

#### Returns

`void`

***

### setDeclaringArkClass()

> **setDeclaringArkClass**(`declaringArkClass`): `void`

Defined in: src/core/model/ArkMethod.ts:258

#### Parameters

##### declaringArkClass

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

### setGenericTypes()

> **setGenericTypes**(`genericTypes`): `void`

Defined in: src/core/model/ArkMethod.ts:388

#### Parameters

##### genericTypes

[`GenericType`](GenericType.md)[]

#### Returns

`void`

***

### setImplementationSignature()

> **setImplementationSignature**(`signature`): `void`

Defined in: src/core/model/ArkMethod.ts:372

Set signature of implementation.
It will reset the implementation signature if it is already defined before.

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

signature of implementation.

#### Returns

`void`

***

### setIsGeneratedFlag()

> **setIsGeneratedFlag**(`isGeneratedFlag`): `void`

Defined in: src/core/model/ArkMethod.ts:580

#### Parameters

##### isGeneratedFlag

`boolean`

#### Returns

`void`

***

### setLine()

> **setLine**(`line`): `void`

Defined in: src/core/model/ArkMethod.ts:202

Set line of the implementation with line number input.
The line number will be encoded together with the original column number.

#### Parameters

##### line

`number`

the line number of the method implementation.

#### Returns

`void`

***

### setLineCol()

> **setLineCol**(`lineCol`): `void`

Defined in: src/core/model/ArkMethod.ts:246

Set lineCol of the implementation directly with LineCol type input.

#### Parameters

##### lineCol

`number`

the encoded line and column with LineCol type.

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

### setOuterMethod()

> **setOuterMethod**(`method`): `void`

Defined in: src/core/model/ArkMethod.ts:709

#### Parameters

##### method

`ArkMethod`

#### Returns

`void`

***

### setQuestionToken()

> **setQuestionToken**(`questionToken`): `void`

Defined in: src/core/model/ArkMethod.ts:718

#### Parameters

##### questionToken

`boolean`

#### Returns

`void`

***

### setViewTree()

> **setViewTree**(`viewTree`): `void`

Defined in: src/core/model/ArkMethod.ts:540

#### Parameters

##### viewTree

[`ViewTree`](../interfaces/ViewTree.md)

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkMethod.ts:592

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
