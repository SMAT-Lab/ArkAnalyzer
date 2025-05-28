[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / BuildInvalidedProject

# Interface: BuildInvalidedProject\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5990

## Extends

- [`InvalidatedProjectBase`](InvalidatedProjectBase.md)

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### kind

> `readonly` **kind**: [`Build`](../enumerations/InvalidatedProjectKind.md#build)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5991

#### Overrides

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`kind`](InvalidatedProjectBase.md#kind)

***

### project

> `readonly` **project**: [`ResolvedConfigFileName`](../type-aliases/ResolvedConfigFileName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5978

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`project`](InvalidatedProjectBase.md#project)

## Methods

### done()

> **done**(`cancellationToken?`, `writeFile?`, `customTransformers?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5982

To dispose this project and ensure that all the necessary actions are taken and state is updated accordingly

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### customTransformers?

[`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`done`](InvalidatedProjectBase.md#done)

***

### emit()

> **emit**(`targetSourceFile?`, `writeFile?`, `cancellationToken?`, `emitOnlyDtsFiles?`, `customTransformers?`): `undefined` \| [`EmitResult`](EmitResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6003

#### Parameters

##### targetSourceFile?

[`SourceFile`](SourceFile.md)

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### emitOnlyDtsFiles?

`boolean`

##### customTransformers?

[`CustomTransformers`](CustomTransformers.md)

#### Returns

`undefined` \| [`EmitResult`](EmitResult.md)

***

### getAllDependencies()

> **getAllDependencies**(`sourceFile`): readonly `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6000

#### Parameters

##### sourceFile

[`SourceFile`](SourceFile.md)

#### Returns

readonly `string`[]

***

### getBuilderProgram()

> **getBuilderProgram**(): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5992

#### Returns

`undefined` \| `T`

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5983

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCompilerOptions`](InvalidatedProjectBase.md#getcompileroptions)

***

### getConfigFileParsingDiagnostics()

> **getConfigFileParsingDiagnostics**(): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5998

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5984

#### Returns

`string`

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCurrentDirectory`](InvalidatedProjectBase.md#getcurrentdirectory)

***

### getGlobalDiagnostics()

> **getGlobalDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5997

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getOptionsDiagnostics()

> **getOptionsDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5996

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getProgram()

> **getProgram**(): `undefined` \| [`Program`](Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5993

#### Returns

`undefined` \| [`Program`](Program.md)

***

### getSemanticDiagnostics()

> **getSemanticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6001

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getSemanticDiagnosticsOfNextAffectedFile()

> **getSemanticDiagnosticsOfNextAffectedFile**(`cancellationToken?`, `ignoreSourceFile?`): [`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6002

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### ignoreSourceFile?

(`sourceFile`) => `boolean`

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

***

### getSourceFile()

> **getSourceFile**(`fileName`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5994

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### getSourceFiles()

> **getSourceFiles**(): readonly [`SourceFile`](SourceFile.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5995

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

***

### getSyntacticDiagnostics()

> **getSyntacticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5999

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]
