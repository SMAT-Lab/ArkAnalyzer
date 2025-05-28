[**ArkAnalyzer**](../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../globals.md) / [ts](../../../README.md) / [ArkTSLinter\_1\_0](../README.md) / TypeScriptLinter

# Class: TypeScriptLinter

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8924

## Constructors

### Constructor

> **new TypeScriptLinter**(`sourceFile`, `tsProgram`, `tscStrictDiagnostics?`): `TypeScriptLinter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8950

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

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8945

***

### currentWarningLine

> **currentWarningLine**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8946

***

### handlersMap

> `readonly` **handlersMap**: [`ESMap`](../../../interfaces/ESMap.md)\<[`SyntaxKind`](../../../enumerations/SyntaxKind.md), (`node`) => `void`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8952

***

### libraryTypeCallDiagnosticChecker

> **libraryTypeCallDiagnosticChecker**: [`LibraryTypeCallDiagnosticChecker`](../namespaces/LibraryTypeCallDiagnosticCheckerNamespace/classes/LibraryTypeCallDiagnosticChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8948

***

### skipArkTSStaticBlocksCheck

> **skipArkTSStaticBlocksCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8949

***

### staticBlocks

> **staticBlocks**: [`Set`](../../../interfaces/Set.md)\<`string`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8947

***

### errorLineNumbersString

> `static` **errorLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8936

***

### filteredDiagnosticMessages

> `static` **filteredDiagnosticMessages**: [`DiagnosticMessageChain`](../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8941

***

### ideMode

> `static` **ideMode**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8927

***

### lineCounters

> `static` **lineCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8934

***

### lintEtsOnly

> `static` **lintEtsOnly**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8931

***

### logTscErrors

> `static` **logTscErrors**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8929

***

### nodeCounters

> `static` **nodeCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8933

***

### problemsInfos

> `static` **problemsInfos**: [`ProblemInfo`](../interfaces/ProblemInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8940

***

### reportDiagnostics

> `static` **reportDiagnostics**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8939

***

### strictMode

> `static` **strictMode**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8928

***

### totalErrorLines

> `static` **totalErrorLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8935

***

### totalVisitedNodes

> `static` **totalVisitedNodes**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8932

***

### totalWarningLines

> `static` **totalWarningLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8937

***

### tsTypeChecker

> `static` **tsTypeChecker**: [`TypeChecker`](../../../interfaces/TypeChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8944

***

### warningLineNumbersString

> `static` **warningLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8938

***

### warningsAsErrors

> `static` **warningsAsErrors**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8930

## Methods

### incrementCounters()

> **incrementCounters**(`node`, `faultId`, `autofixable?`, `autofix?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8953

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

### lint()

> **lint**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9038

#### Returns

`void`

***

### visitTSNode()

> **visitTSNode**(`node`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8954

#### Parameters

##### node

[`Node`](../../../interfaces/Node.md)

#### Returns

`void`

***

### clearTsTypeChecker()

> `static` **clearTsTypeChecker**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8951

#### Returns

`void`

***

### initGlobals()

> `static` **initGlobals**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8942

#### Returns

`void`

***

### initStatic()

> `static` **initStatic**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8943

#### Returns

`void`
