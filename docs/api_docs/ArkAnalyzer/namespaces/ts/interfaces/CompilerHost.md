[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CompilerHost

# Interface: CompilerHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3473

## Extends

- [`ModuleResolutionHost`](ModuleResolutionHost.md)

## Properties

### writeFile

> **writeFile**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3479

## Methods

### createHash()?

> `optional` **createHash**(`data`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3497

#### Parameters

##### data

`string`

#### Returns

`string`

***

### directoryExists()?

> `optional` **directoryExists**(`directoryName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3343

#### Parameters

##### directoryName

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`directoryExists`](ModuleResolutionHost.md#directoryexists)

***

### fileExists()

> **fileExists**(`fileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3340

#### Parameters

##### fileName

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`fileExists`](ModuleResolutionHost.md#fileexists)

***

### getCancellationToken()?

> `optional` **getCancellationToken**(): [`CancellationToken`](CancellationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3476

#### Returns

[`CancellationToken`](CancellationToken.md)

***

### getCanonicalFileName()

> **getCanonicalFileName**(`fileName`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3481

#### Parameters

##### fileName

`string`

#### Returns

`string`

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3480

#### Returns

`string`

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getCurrentDirectory`](ModuleResolutionHost.md#getcurrentdirectory)

***

### getDefaultLibFileName()

> **getDefaultLibFileName**(`options`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3477

#### Parameters

##### options

[`CompilerOptions`](CompilerOptions.md)

#### Returns

`string`

***

### getDefaultLibLocation()?

> `optional` **getDefaultLibLocation**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3478

#### Returns

`string`

***

### getDirectories()?

> `optional` **getDirectories**(`path`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3350

#### Parameters

##### path

`string`

#### Returns

`string`[]

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getDirectories`](ModuleResolutionHost.md#getdirectories)

***

### getEnvironmentVariable()?

> `optional` **getEnvironmentVariable**(`name`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3494

#### Parameters

##### name

`string`

#### Returns

`undefined` \| `string`

***

### getFileCheckedModuleInfo()?

> `optional` **getFileCheckedModuleInfo**(`containFilePath`): [`FileCheckModuleInfo`](FileCheckModuleInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3511

#### Parameters

##### containFilePath

`string`

#### Returns

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getFileCheckedModuleInfo`](ModuleResolutionHost.md#getfilecheckedmoduleinfo)

***

### getJsDocNodeCheckedConfig()?

> `optional` **getJsDocNodeCheckedConfig**(`jsDocFileCheckInfo`, `symbolSourceFilePath`): [`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3504

get tagName where need to be determined based on the file path

#### Parameters

##### jsDocFileCheckInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

filePath

##### symbolSourceFilePath

`string`

filePath

#### Returns

[`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getJsDocNodeCheckedConfig`](ModuleResolutionHost.md#getjsdocnodecheckedconfig)

***

### getJsDocNodeConditionCheckedResult()?

> `optional` **getJsDocNodeConditionCheckedResult**(`jsDocFileCheckedInfo`, `jsDocs`): [`ConditionCheckResult`](ConditionCheckResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3510

get checked results based on the file path and jsDocs

#### Parameters

##### jsDocFileCheckedInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### jsDocs

[`JsDocTagInfo`](JsDocTagInfo.md)[]

#### Returns

[`ConditionCheckResult`](ConditionCheckResult.md)

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getJsDocNodeConditionCheckedResult`](ModuleResolutionHost.md#getjsdocnodeconditioncheckedresult)

***

### getLastCompiledProgram()?

> `optional` **getLastCompiledProgram**(): [`Program`](Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3512

#### Returns

[`Program`](Program.md)

***

### getModuleResolutionCache()?

> `optional` **getModuleResolutionCache**(): `undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3489

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

***

### getNewLine()

> **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3483

#### Returns

`string`

***

### getParsedCommandLine()?

> `optional` **getParsedCommandLine**(`fileName`): `undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3498

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

***

### getSourceFile()

> **getSourceFile**(`fileName`, `languageVersionOrOptions`, `onError?`, `shouldCreateNewSourceFile?`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3474

#### Parameters

##### fileName

`string`

##### languageVersionOrOptions

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

##### onError?

(`message`) => `void`

##### shouldCreateNewSourceFile?

`boolean`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### getSourceFileByPath()?

> `optional` **getSourceFileByPath**(`fileName`, `path`, `languageVersionOrOptions`, `onError?`, `shouldCreateNewSourceFile?`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3475

#### Parameters

##### fileName

`string`

##### path

[`Path`](../type-aliases/Path.md)

##### languageVersionOrOptions

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

##### onError?

(`message`) => `void`

##### shouldCreateNewSourceFile?

`boolean`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### hasInvalidatedResolutions()?

> `optional` **hasInvalidatedResolutions**(`filePath`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3496

If provided along with custom resolveModuleNames or resolveTypeReferenceDirectives, used to determine if unchanged file path needs to re-resolve modules/type reference directives

#### Parameters

##### filePath

[`Path`](../type-aliases/Path.md)

#### Returns

`boolean`

***

### readDirectory()?

> `optional` **readDirectory**(`rootDir`, `extensions`, `excludes`, `includes`, `depth?`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3484

#### Parameters

##### rootDir

`string`

##### extensions

readonly `string`[]

##### excludes

`undefined` | readonly `string`[]

##### includes

readonly `string`[]

##### depth?

`number`

#### Returns

`string`[]

***

### readFile()

> **readFile**(`fileName`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3341

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`readFile`](ModuleResolutionHost.md#readfile)

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3348

Resolve a symbolic link.

#### Parameters

##### path

`string`

#### Returns

`string`

#### See

https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`realpath`](ModuleResolutionHost.md#realpath)

***

### resolveModuleNames()?

> `optional` **resolveModuleNames**(`moduleNames`, `containingFile`, `reusedNames`, `redirectedReference`, `options`, `containingSourceFile?`): (`undefined` \| [`ResolvedModule`](ResolvedModule.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3485

#### Parameters

##### moduleNames

`string`[]

##### containingFile

`string`

##### reusedNames

`undefined` | `string`[]

##### redirectedReference

`undefined` | [`ResolvedProjectReference`](ResolvedProjectReference.md)

##### options

[`CompilerOptions`](CompilerOptions.md)

##### containingSourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

(`undefined` \| [`ResolvedModule`](ResolvedModule.md))[]

***

### resolveTypeReferenceDirectives()?

> `optional` **resolveTypeReferenceDirectives**(`typeReferenceDirectiveNames`, `containingFile`, `redirectedReference`, `options`, `containingFileMode?`): (`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3493

This method is a companion for 'resolveModuleNames' and is used to resolve 'types' references to actual type declaration files

#### Parameters

##### typeReferenceDirectiveNames

`string`[] | readonly [`FileReference`](FileReference.md)[]

##### containingFile

`string`

##### redirectedReference

`undefined` | [`ResolvedProjectReference`](ResolvedProjectReference.md)

##### options

[`CompilerOptions`](CompilerOptions.md)

##### containingFileMode?

[`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

#### Returns

(`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3342

#### Parameters

##### s

`string`

#### Returns

`void`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`trace`](ModuleResolutionHost.md#trace)

***

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3482

#### Returns

`boolean`

#### Overrides

`ModuleResolutionHost.useCaseSensitiveFileNames`
