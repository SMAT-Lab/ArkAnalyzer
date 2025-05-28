[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / EmitTextWriter

# Interface: EmitTextWriter

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4319

## Extends

- `SymbolWriter`

## Properties

### moduleResolverHost?

> `optional` **moduleResolverHost**: [`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md) & `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4384

#### Type declaration

##### getCommonSourceDirectory()

> **getCommonSourceDirectory**(): `string`

###### Returns

`string`

#### Inherited from

`SymbolWriter.moduleResolverHost`

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2569

#### Returns

`void`

#### Inherited from

`SymbolWriter.clear`

***

### decreaseIndent()

> **decreaseIndent**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2568

#### Returns

`void`

#### Inherited from

`SymbolWriter.decreaseIndent`

***

### getColumn()

> **getColumn**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4328

#### Returns

`number`

***

### getIndent()

> **getIndent**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4329

#### Returns

`number`

***

### getLine()

> **getLine**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4327

#### Returns

`number`

***

### getText()

> **getText**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4323

#### Returns

`string`

***

### getTextPos()

> **getTextPos**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4326

#### Returns

`number`

***

### getTextPosWithWriteLine()?

> `optional` **getTextPosWithWriteLine**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4333

#### Returns

`number`

***

### hasTrailingComment()

> **hasTrailingComment**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4331

#### Returns

`boolean`

***

### hasTrailingWhitespace()

> **hasTrailingWhitespace**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4332

#### Returns

`boolean`

***

### increaseIndent()

> **increaseIndent**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2567

#### Returns

`void`

#### Inherited from

`SymbolWriter.increaseIndent`

***

### isAtStartOfLine()

> **isAtStartOfLine**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4330

#### Returns

`boolean`

***

### nonEscapingWrite()?

> `optional` **nonEscapingWrite**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4334

#### Parameters

##### text

`string`

#### Returns

`void`

***

### rawWrite()

> **rawWrite**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4324

#### Parameters

##### s

`string`

#### Returns

`void`

***

### reportCyclicStructureError()?

> `optional` **reportCyclicStructureError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4381

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportCyclicStructureError`

***

### reportImportTypeNodeResolutionModeOverride()?

> `optional` **reportImportTypeNodeResolutionModeOverride**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4391

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportImportTypeNodeResolutionModeOverride`

***

### reportInaccessibleThisError()?

> `optional` **reportInaccessibleThisError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4378

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportInaccessibleThisError`

***

### reportInaccessibleUniqueSymbolError()?

> `optional` **reportInaccessibleUniqueSymbolError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4380

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportInaccessibleUniqueSymbolError`

***

### reportLikelyUnsafeImportRequiredError()?

> `optional` **reportLikelyUnsafeImportRequiredError**(`specifier`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4382

#### Parameters

##### specifier

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportLikelyUnsafeImportRequiredError`

***

### reportNonlocalAugmentation()?

> `optional` **reportNonlocalAugmentation**(`containingFile`, `parentSymbol`, `augmentingSymbol`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4389

#### Parameters

##### containingFile

[`SourceFile`](SourceFile.md)

##### parentSymbol

[`Symbol`](Symbol.md)

##### augmentingSymbol

[`Symbol`](Symbol.md)

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportNonlocalAugmentation`

***

### reportNonSerializableProperty()?

> `optional` **reportNonSerializableProperty**(`propertyName`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4390

#### Parameters

##### propertyName

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportNonSerializableProperty`

***

### reportPrivateInBaseOfClassExpression()?

> `optional` **reportPrivateInBaseOfClassExpression**(`propertyName`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4379

#### Parameters

##### propertyName

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportPrivateInBaseOfClassExpression`

***

### reportTruncationError()?

> `optional` **reportTruncationError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4383

#### Returns

`void`

#### Inherited from

`SymbolWriter.reportTruncationError`

***

### trackExternalModuleSymbolOfImportTypeNode()?

> `optional` **trackExternalModuleSymbolOfImportTypeNode**(`symbol`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4388

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`void`

#### Inherited from

`SymbolWriter.trackExternalModuleSymbolOfImportTypeNode`

***

### trackReferencedAmbientModule()?

> `optional` **trackReferencedAmbientModule**(`decl`, `symbol`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4387

#### Parameters

##### decl

[`ModuleDeclaration`](ModuleDeclaration.md)

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`void`

#### Inherited from

`SymbolWriter.trackReferencedAmbientModule`

***

### trackSymbol()?

> `optional` **trackSymbol**(`symbol`, `enclosingDeclaration`, `meaning`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4377

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### meaning

[`SymbolFlags`](../enumerations/SymbolFlags.md)

#### Returns

`boolean`

#### Inherited from

`SymbolWriter.trackSymbol`

***

### write()

> **write**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4320

#### Parameters

##### s

`string`

#### Returns

`void`

***

### writeComment()

> **writeComment**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4322

#### Parameters

##### text

`string`

#### Returns

`void`

***

### writeKeyword()

> **writeKeyword**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2558

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeKeyword`

***

### writeLine()

> **writeLine**(`force?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2566

#### Parameters

##### force?

`boolean`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeLine`

***

### writeLiteral()

> **writeLiteral**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4325

#### Parameters

##### s

`string`

#### Returns

`void`

***

### writeOperator()

> **writeOperator**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2559

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeOperator`

***

### writeParameter()

> **writeParameter**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2563

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeParameter`

***

### writeProperty()

> **writeProperty**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2564

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeProperty`

***

### writePunctuation()

> **writePunctuation**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2560

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writePunctuation`

***

### writeSpace()

> **writeSpace**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2561

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeSpace`

***

### writeStringLiteral()

> **writeStringLiteral**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2562

#### Parameters

##### text

`string`

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeStringLiteral`

***

### writeSymbol()

> **writeSymbol**(`text`, `symbol`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2565

#### Parameters

##### text

`string`

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`void`

#### Inherited from

`SymbolWriter.writeSymbol`

***

### writeTrailingSemicolon()

> **writeTrailingSemicolon**(`text`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4321

#### Parameters

##### text

`string`

#### Returns

`void`
