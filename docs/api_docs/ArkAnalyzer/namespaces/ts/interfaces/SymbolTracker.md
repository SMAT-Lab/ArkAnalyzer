[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SymbolTracker

# Interface: SymbolTracker

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4376

## Properties

### moduleResolverHost?

> `optional` **moduleResolverHost**: [`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md) & `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4384

#### Type declaration

##### getCommonSourceDirectory()

> **getCommonSourceDirectory**(): `string`

###### Returns

`string`

## Methods

### reportCyclicStructureError()?

> `optional` **reportCyclicStructureError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4381

#### Returns

`void`

***

### reportImportTypeNodeResolutionModeOverride()?

> `optional` **reportImportTypeNodeResolutionModeOverride**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4391

#### Returns

`void`

***

### reportInaccessibleThisError()?

> `optional` **reportInaccessibleThisError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4378

#### Returns

`void`

***

### reportInaccessibleUniqueSymbolError()?

> `optional` **reportInaccessibleUniqueSymbolError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4380

#### Returns

`void`

***

### reportLikelyUnsafeImportRequiredError()?

> `optional` **reportLikelyUnsafeImportRequiredError**(`specifier`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4382

#### Parameters

##### specifier

`string`

#### Returns

`void`

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

***

### reportNonSerializableProperty()?

> `optional` **reportNonSerializableProperty**(`propertyName`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4390

#### Parameters

##### propertyName

`string`

#### Returns

`void`

***

### reportPrivateInBaseOfClassExpression()?

> `optional` **reportPrivateInBaseOfClassExpression**(`propertyName`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4379

#### Parameters

##### propertyName

`string`

#### Returns

`void`

***

### reportTruncationError()?

> `optional` **reportTruncationError**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4383

#### Returns

`void`

***

### trackExternalModuleSymbolOfImportTypeNode()?

> `optional` **trackExternalModuleSymbolOfImportTypeNode**(`symbol`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4388

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`void`

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
