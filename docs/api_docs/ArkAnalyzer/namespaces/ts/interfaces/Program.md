[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Program

# Interface: Program

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2273

## Extends

- [`ScriptReferenceHost`](ScriptReferenceHost.md)

## Methods

### emit()

> **emit**(`targetSourceFile?`, `writeFile?`, `cancellationToken?`, `emitOnlyDtsFiles?`, `customTransformers?`): [`EmitResult`](EmitResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2293

Emits the JavaScript and declaration files.  If targetSourceFile is not specified, then
the JavaScript and declaration files will be produced for all the files in this program.
If targetSourceFile is specified, then only the JavaScript and declaration for that
specific file will be generated.

If writeFile is not specified then the writeFile callback from the compiler host will be
used for writing the JavaScript and declaration files.  Otherwise, the writeFile parameter
will be invoked when writing the JavaScript and declaration files.

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

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2231

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getCompilerOptions`](ScriptReferenceHost.md#getcompileroptions)

***

### getConfigFileParsingDiagnostics()

> **getConfigFileParsingDiagnostics**(): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2301

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2274

#### Returns

`string`

#### Overrides

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getCurrentDirectory`](ScriptReferenceHost.md#getcurrentdirectory)

***

### getDeclarationDiagnostics()

> **getDeclarationDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2300

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

***

### getEtsLibSFromProgram()

> **getEtsLibSFromProgram**(): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2302

#### Returns

`string`[]

***

### getFileCheckedModuleInfo()?

> `optional` **getFileCheckedModuleInfo**(`containFilePath`): [`FileCheckModuleInfo`](FileCheckModuleInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2329

#### Parameters

##### containFilePath

`string`

#### Returns

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

***

### getGlobalDiagnostics()

> **getGlobalDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2295

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getIdentifierCount()

> **getIdentifierCount**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2312

#### Returns

`number`

***

### getInstantiationCount()

> **getInstantiationCount**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2315

#### Returns

`number`

***

### getJsDocNodeCheckedConfig()?

> `optional` **getJsDocNodeCheckedConfig**(`jsDocFileCheckInfo`, `symbolSourceFilePath`): [`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2327

#### Parameters

##### jsDocFileCheckInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### symbolSourceFilePath

`string`

#### Returns

[`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

***

### getJsDocNodeConditionCheckedResult()?

> `optional` **getJsDocNodeConditionCheckedResult**(`jsDocFileCheckedInfo`, `jsDocs`): [`ConditionCheckResult`](ConditionCheckResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2328

#### Parameters

##### jsDocFileCheckedInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### jsDocs

[`JsDocTagInfo`](JsDocTagInfo.md)[]

#### Returns

[`ConditionCheckResult`](ConditionCheckResult.md)

***

### getLinterTypeChecker()

> **getLinterTypeChecker**(): [`TypeChecker`](TypeChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2310

Gets a type checker that can be used to semantically analyze source files in the program for arkts linter.

#### Returns

[`TypeChecker`](TypeChecker.md)

***

### getNodeCount()

> **getNodeCount**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2311

#### Returns

`number`

***

### getOptionsDiagnostics()

> **getOptionsDiagnostics**(`cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2294

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getProjectReferences()

> **getProjectReferences**(): `undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2325

#### Returns

`undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

***

### getRelationCacheSizes()

> **getRelationCacheSizes**(): `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2316

#### Returns

`object`

##### assignable

> **assignable**: `number`

##### identity

> **identity**: `number`

##### strictSubtype

> **strictSubtype**: `number`

##### subtype

> **subtype**: `number`

***

### getResolvedProjectReferences()

> **getResolvedProjectReferences**(): `undefined` \| readonly (`undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2326

#### Returns

`undefined` \| readonly (`undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md))[]

***

### getRootFileNames()

> **getRootFileNames**(): readonly `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2278

Get a list of root file names that were passed to a 'createProgram'

#### Returns

readonly `string`[]

***

### getSemanticDiagnostics()

> **getSemanticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2298

The first time this is called, it will return global diagnostics (no location).

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getSemanticDiagnosticsForLinter()

> **getSemanticDiagnosticsForLinter**(`sourceFile?`, `cancellationToken?`): readonly [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2299

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

***

### getSourceFile()

> **getSourceFile**(`fileName`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2232

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getSourceFile`](ScriptReferenceHost.md#getsourcefile)

***

### getSourceFileByPath()

> **getSourceFileByPath**(`path`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2233

#### Parameters

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getSourceFileByPath`](ScriptReferenceHost.md#getsourcefilebypath)

***

### getSourceFileFromReference()

> **getSourceFileFromReference**(`referencingFile`, `ref`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2324

#### Parameters

##### referencingFile

[`SourceFile`](SourceFile.md) | [`UnparsedSource`](UnparsedSource.md)

##### ref

[`FileReference`](FileReference.md)

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### getSourceFiles()

> **getSourceFiles**(): readonly [`SourceFile`](SourceFile.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2282

Get a list of files in the program

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

***

### getSymbolCount()

> **getSymbolCount**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2313

#### Returns

`number`

***

### getSyntacticDiagnostics()

> **getSyntacticDiagnostics**(`sourceFile?`, `cancellationToken?`): readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2296

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

***

### getTypeChecker()

> **getTypeChecker**(): [`TypeChecker`](TypeChecker.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2306

Gets a type checker that can be used to semantically analyze source files in the program.

#### Returns

[`TypeChecker`](TypeChecker.md)

***

### getTypeCount()

> **getTypeCount**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2314

#### Returns

`number`

***

### isSourceFileDefaultLibrary()

> **isSourceFileDefaultLibrary**(`file`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2323

#### Parameters

##### file

[`SourceFile`](SourceFile.md)

#### Returns

`boolean`

***

### isSourceFileFromExternalLibrary()

> **isSourceFileFromExternalLibrary**(`file`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2322

#### Parameters

##### file

[`SourceFile`](SourceFile.md)

#### Returns

`boolean`

***

### releaseTypeChecker()

> **releaseTypeChecker**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2333

Release typeChecker & linterTypeChecker

#### Returns

`void`
