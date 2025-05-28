[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / EmitAndSemanticDiagnosticsBuilderProgram

# Interface: EmitAndSemanticDiagnosticsBuilderProgram

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5747

The builder that can handle the changes in program and iterate through changed file to emit the files
The semantic diagnostics are cached per file and managed by clearing for the changed/affected files

## Extends

- [`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md)

## Properties

### builderProgramForLinter?

> `optional` **builderProgramForLinter**: `EmitAndSemanticDiagnosticsBuilderProgram`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5731

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`builderProgramForLinter`](SemanticDiagnosticsBuilderProgram.md#builderprogramforlinter)

## Methods

### emit()

> **emit**(`targetSourceFile?`, `writeFile?`, `cancellationToken?`, `emitOnlyDtsFiles?`, `customTransformers?`): [`EmitResult`](EmitResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5725

Emits the JavaScript and declaration files.
When targetSource file is specified, emits the files corresponding to that source file,
otherwise for the whole program.
In case of EmitAndSemanticDiagnosticsBuilderProgram, when targetSourceFile is specified,
it is assumed that that file is handled from affected file list. If targetSourceFile is not specified,
it will only emit all the affected files instead of whole program

The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
in that order would be used to write the files

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

[`EmitResult`](EmitResult.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`emit`](SemanticDiagnosticsBuilderProgram.md#emit)

***

### emitNextAffectedFile()

> **emitNextAffectedFile**(`writeFile?`, `cancellationToken?`, `emitOnlyDtsFiles?`, `customTransformers?`): [`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<[`EmitResult`](EmitResult.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5753

Emits the next affected file's emit result (EmitResult and sourceFiles emitted) or returns undefined if iteration is complete
The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
in that order would be used to write the files

#### Parameters

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### emitOnlyDtsFiles?

`boolean`

##### customTransformers?

[`CustomTransformers`](CustomTransformers.md)

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<[`EmitResult`](EmitResult.md)\>

***

### getAllDependencies()

> **getAllDependencies**(`sourceFile`): readonly `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5704

Get all the dependencies of the file

#### Parameters

##### sourceFile

[`SourceFile`](SourceFile.md)

#### Returns

readonly `string`[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getAllDependencies`](SemanticDiagnosticsBuilderProgram.md#getalldependencies)

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5672

Get compiler options of the program

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getCompilerOptions`](SemanticDiagnosticsBuilderProgram.md#getcompileroptions)

***

### getConfigFileParsingDiagnostics()

> **getConfigFileParsingDiagnostics**(): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5692

Get the diagnostics from config file parsing

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getConfigFileParsingDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getconfigfileparsingdiagnostics)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5729

Get the current directory of the program

#### Returns

`string`

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getCurrentDirectory`](SemanticDiagnosticsBuilderProgram.md#getcurrentdirectory)

***

### getDeclarationDiagnostics()

> **getDeclarationDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5700

Get the declaration diagnostics, for all source files if source file is not supplied

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getDeclarationDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getdeclarationdiagnostics)

***

### getGlobalDiagnostics()

> **getGlobalDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5688

Get the diagnostics that dont belong to any file

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getGlobalDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getglobaldiagnostics)

***

### getOptionsDiagnostics()

> **getOptionsDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5684

Get the diagnostics for compiler options

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getOptionsDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getoptionsdiagnostics)

***

### getProgram()

> **getProgram**(): [`Program`](Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5668

Returns current program

#### Returns

[`Program`](Program.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getProgram`](SemanticDiagnosticsBuilderProgram.md#getprogram)

***

### getSemanticDiagnostics()

> **getSemanticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5713

Gets the semantic diagnostics from the program corresponding to this state of file (if provided) or whole program
The semantic diagnostics are cached and managed here
Note that it is assumed that when asked about semantic diagnostics through this API,
the file has been taken out of affected files so it is safe to use cache or get from program and cache the diagnostics
In case of SemanticDiagnosticsBuilderProgram if the source file is not provided,
it will iterate through all the affected files, to ensure that cache stays valid and yet provide a way to get all semantic diagnostics

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSemanticDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getsemanticdiagnostics)

***

### getSemanticDiagnosticsOfNextAffectedFile()

> **getSemanticDiagnosticsOfNextAffectedFile**(`cancellationToken?`, `ignoreSourceFile?`): [`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5741

Gets the semantic diagnostics from the program for the next affected file and caches it
Returns undefined if the iteration is complete

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### ignoreSourceFile?

(`sourceFile`) => `boolean`

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSemanticDiagnosticsOfNextAffectedFile`](SemanticDiagnosticsBuilderProgram.md#getsemanticdiagnosticsofnextaffectedfile)

***

### getSourceFile()

> **getSourceFile**(`fileName`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5676

Get the source file in the program with file name

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSourceFile`](SemanticDiagnosticsBuilderProgram.md#getsourcefile)

***

### getSourceFiles()

> **getSourceFiles**(): readonly [`SourceFile`](SourceFile.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5680

Get a list of files in the program

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSourceFiles`](SemanticDiagnosticsBuilderProgram.md#getsourcefiles)

***

### getSyntacticDiagnostics()

> **getSyntacticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5696

Get the syntax diagnostics, for all source files if source file is not supplied

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSyntacticDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getsyntacticdiagnostics)

***

### isFileUpdateInConstEnumCache()?

> `optional` **isFileUpdateInConstEnumCache**(`sourceFile`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5730

#### Parameters

##### sourceFile

[`SourceFile`](SourceFile.md)

#### Returns

`boolean`

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`isFileUpdateInConstEnumCache`](SemanticDiagnosticsBuilderProgram.md#isfileupdateinconstenumcache)
