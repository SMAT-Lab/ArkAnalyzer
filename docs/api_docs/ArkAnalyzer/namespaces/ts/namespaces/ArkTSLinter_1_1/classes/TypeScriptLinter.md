[**ArkAnalyzer**](../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../globals.md) / [ts](../../../README.md) / [ArkTSLinter\_1\_1](../README.md) / TypeScriptLinter

# Class: TypeScriptLinter

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9530

## Constructors

### Constructor

> **new TypeScriptLinter**(`sourceFile`, `tsProgram`, `tscStrictDiagnostics?`): `TypeScriptLinter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9562

#### Parameters

##### sourceFile

[`SourceFile`](../../../interfaces/SourceFile.md)

##### tsProgram

[`Program`](../../../interfaces/Program.md)

##### tscStrictDiagnostics?

[`Map`](../../../interfaces/Map.md)\<[`Diagnostic`](../../../interfaces/Diagnostic.md)[]\>

#### Returns

`TypeScriptLinter`

## Properties

### currentErrorLine

> **currentErrorLine**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9554

***

### currentWarningLine

> **currentWarningLine**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9555

***

### handlersMap

> `readonly` **handlersMap**: [`ESMap`](../../../interfaces/ESMap.md)\<[`SyntaxKind`](../../../enumerations/SyntaxKind.md), (`node`) => `void`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9564

***

### libraryTypeCallDiagnosticChecker

> **libraryTypeCallDiagnosticChecker**: [`LibraryTypeCallDiagnosticChecker`](../namespaces/LibraryTypeCallDiagnosticCheckerNamespace/classes/LibraryTypeCallDiagnosticChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9557

***

### skipArkTSStaticBlocksCheck

> **skipArkTSStaticBlocksCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9558

***

### staticBlocks

> **staticBlocks**: [`Set`](../../../interfaces/Set.md)\<`string`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9556

***

### errorLineNumbersString

> `static` **errorLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9542

***

### filteredDiagnosticMessages

> `static` **filteredDiagnosticMessages**: [`DiagnosticMessageChain`](../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9547

***

### ideMode

> `static` **ideMode**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9533

***

### lineCounters

> `static` **lineCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9540

***

### lintEtsOnly

> `static` **lintEtsOnly**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9537

***

### logTscErrors

> `static` **logTscErrors**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9535

***

### nodeCounters

> `static` **nodeCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9539

***

### problemsInfos

> `static` **problemsInfos**: [`ProblemInfo`](../interfaces/ProblemInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9546

***

### reportDiagnostics

> `static` **reportDiagnostics**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9545

***

### sharedModulesCache

> `static` **sharedModulesCache**: [`ESMap`](../../../interfaces/ESMap.md)\<`string`, `boolean`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9548

***

### strictDiagnosticCache

> `static` **strictDiagnosticCache**: [`Set`](../../../interfaces/Set.md)\<[`Diagnostic`](../../../interfaces/Diagnostic.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9549

***

### strictMode

> `static` **strictMode**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9534

***

### totalErrorLines

> `static` **totalErrorLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9541

***

### totalVisitedNodes

> `static` **totalVisitedNodes**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9538

***

### totalWarningLines

> `static` **totalWarningLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9543

***

### tsTypeChecker

> `static` **tsTypeChecker**: [`TypeChecker`](../../../interfaces/TypeChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9553

***

### unknowDiagnosticCache

> `static` **unknowDiagnosticCache**: [`Set`](../../../interfaces/Set.md)\<[`Diagnostic`](../../../interfaces/Diagnostic.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9550

***

### warningLineNumbersString

> `static` **warningLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9544

***

### warningsAsErrors

> `static` **warningsAsErrors**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9536

## Methods

### incrementCounters()

> **incrementCounters**(`node`, `faultId`, `autofixable?`, `autofix?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9565

#### Parameters

##### node

[`Node`](../../../interfaces/Node.md) | [`CommentRange`](../../../interfaces/CommentRange.md)

##### faultId

`number`

##### autofixable?

`boolean`

##### autofix?

[`Autofix`](../namespaces/Autofixer/interfaces/Autofix.md)[]

#### Returns

`void`

***

### isFileExportSendableDecl()

> **isFileExportSendableDecl**(`decl`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9616

#### Parameters

##### decl

[`Declaration`](../../../interfaces/Declaration.md)

#### Returns

`boolean`

***

### lint()

> **lint**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9675

#### Returns

`void`

***

### clearTsTypeChecker()

> `static` **clearTsTypeChecker**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9563

#### Returns

`void`

***

### initGlobals()

> `static` **initGlobals**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9551

#### Returns

`void`

***

### initStatic()

> `static` **initStatic**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9552

#### Returns

`void`
