[**ArkAnalyzer**](../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../globals.md) / [ts](../../../README.md) / [ArkTSLinter\_1\_1](../README.md) / InteropTypescriptLinter

# Class: InteropTypescriptLinter

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9701

## Constructors

### Constructor

> **new InteropTypescriptLinter**(`sourceFile`, `tsProgram`, `isInSdk`): `InteropTypescriptLinter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9726

#### Parameters

##### sourceFile

[`SourceFile`](../../../interfaces/SourceFile.md)

##### tsProgram

[`Program`](../../../interfaces/Program.md)

##### isInSdk

`boolean`

#### Returns

`InteropTypescriptLinter`

## Properties

### currentErrorLine

> **currentErrorLine**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9724

***

### currentWarningLine

> **currentWarningLine**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9725

***

### handlersMap

> `readonly` **handlersMap**: [`ESMap`](../../../interfaces/ESMap.md)\<[`SyntaxKind`](../../../enumerations/SyntaxKind.md), (`node`) => `void`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9728

***

### errorLineNumbersString

> `static` **errorLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9709

***

### etsLoaderPath?

> `static` `optional` **etsLoaderPath**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9717

***

### kitInfos

> `static` **kitInfos**: [`Map`](../../../interfaces/Map.md)\<[`KitInfo`](../interfaces/KitInfo.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9718

***

### lineCounters

> `static` **lineCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9707

***

### nodeCounters

> `static` **nodeCounters**: `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9706

***

### problemsInfos

> `static` **problemsInfos**: [`ProblemInfo`](../interfaces/ProblemInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9713

***

### reportDiagnostics

> `static` **reportDiagnostics**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9712

***

### strictMode

> `static` **strictMode**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9704

***

### totalErrorLines

> `static` **totalErrorLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9708

***

### totalVisitedNodes

> `static` **totalVisitedNodes**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9705

***

### totalWarningLines

> `static` **totalWarningLines**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9710

***

### tsTypeChecker

> `static` **tsTypeChecker**: [`TypeChecker`](../../../interfaces/TypeChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9716

***

### warningLineNumbersString

> `static` **warningLineNumbersString**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9711

## Methods

### incrementCounters()

> **incrementCounters**(`node`, `faultId`, `autofixable?`, `autofix?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9729

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

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9749

#### Returns

`void`

***

### clearTsTypeChecker()

> `static` **clearTsTypeChecker**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9727

#### Returns

`void`

***

### initGlobals()

> `static` **initGlobals**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9714

#### Returns

`void`

***

### initStatic()

> `static` **initStatic**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9715

#### Returns

`void`
