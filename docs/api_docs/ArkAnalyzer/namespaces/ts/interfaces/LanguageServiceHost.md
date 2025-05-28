[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / LanguageServiceHost

# Interface: LanguageServiceHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6222

Used by services to specify the minimum host area required to set up source files under any compilation settings

## Extends

- [`GetEffectiveTypeRootsHost`](GetEffectiveTypeRootsHost.md).[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

## Properties

### shouldCompletionSortCustom?

> `optional` **shouldCompletionSortCustom**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6259

***

### uiProps?

> `optional` **uiProps**: `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6260

## Methods

### clearProps()?

> `optional` **clearProps**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6261

#### Returns

`void`

***

### directoryExists()?

> `optional` **directoryExists**(`directoryName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4337

#### Parameters

##### directoryName

`string`

#### Returns

`boolean`

#### Inherited from

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`directoryExists`](MinimalResolutionCacheHost.md#directoryexists)

***

### error()?

> `optional` **error**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6237

#### Parameters

##### s

`string`

#### Returns

`void`

***

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6242

#### Parameters

##### path

`string`

#### Returns

`boolean`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`fileExists`](MinimalResolutionCacheHost.md#fileexists)

***

### getCancellationToken()?

> `optional` **getCancellationToken**(): [`HostCancellationToken`](HostCancellationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6232

#### Returns

[`HostCancellationToken`](HostCancellationToken.md)

***

### getCompilationSettings()

> **getCompilationSettings**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6223

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCompilationSettings`](MinimalResolutionCacheHost.md#getcompilationsettings)

***

### getCompilerHost()?

> `optional` **getCompilerHost**(): `undefined` \| [`CompilerHost`](CompilerHost.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3361

#### Returns

`undefined` \| [`CompilerHost`](CompilerHost.md)

#### Inherited from

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCompilerHost`](MinimalResolutionCacheHost.md#getcompilerhost)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6233

#### Returns

`string`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCurrentDirectory`](MinimalResolutionCacheHost.md#getcurrentdirectory)

***

### getCustomTransformers()?

> `optional` **getCustomTransformers**(): `undefined` \| [`CustomTransformers`](CustomTransformers.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6251

Gets a set of custom transformers to use during emit.

#### Returns

`undefined` \| [`CustomTransformers`](CustomTransformers.md)

***

### getDefaultLibFileName()

> **getDefaultLibFileName**(`options`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6234

#### Parameters

##### options

[`CompilerOptions`](CompilerOptions.md)

#### Returns

`string`

***

### getDirectories()?

> `optional` **getDirectories**(`directoryName`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6247

#### Parameters

##### directoryName

`string`

#### Returns

`string`[]

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getDirectories`](MinimalResolutionCacheHost.md#getdirectories)

***

### getFileCheckedModuleInfo()?

> `optional` **getFileCheckedModuleInfo**(`containFilePath`): [`FileCheckModuleInfo`](FileCheckModuleInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6258

#### Parameters

##### containFilePath

`string`

#### Returns

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getFileCheckedModuleInfo`](MinimalResolutionCacheHost.md#getfilecheckedmoduleinfo)

***

### getJsDocNodeCheckedConfig()?

> `optional` **getJsDocNodeCheckedConfig**(`jsDocFileCheckInfo`, `symbolSourceFilePath`): [`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6256

#### Parameters

##### jsDocFileCheckInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### symbolSourceFilePath

`string`

#### Returns

[`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getJsDocNodeCheckedConfig`](MinimalResolutionCacheHost.md#getjsdocnodecheckedconfig)

***

### getJsDocNodeConditionCheckedResult()?

> `optional` **getJsDocNodeConditionCheckedResult**(`jsDocFileCheckedInfo`, `jsDocs`): [`ConditionCheckResult`](ConditionCheckResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6257

#### Parameters

##### jsDocFileCheckedInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### jsDocs

[`JsDocTagInfo`](JsDocTagInfo.md)[]

#### Returns

[`ConditionCheckResult`](ConditionCheckResult.md)

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getJsDocNodeConditionCheckedResult`](MinimalResolutionCacheHost.md#getjsdocnodeconditioncheckedresult)

***

### getLocalizedDiagnosticMessages()?

> `optional` **getLocalizedDiagnosticMessages**(): `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6231

#### Returns

`any`

***

### getNewLine()?

> `optional` **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6224

#### Returns

`string`

***

### getParsedCommandLine()?

> `optional` **getParsedCommandLine**(`fileName`): `undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6255

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

***

### getProjectReferences()?

> `optional` **getProjectReferences**(): `undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6230

#### Returns

`undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

***

### getProjectVersion()?

> `optional` **getProjectVersion**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6225

#### Returns

`string`

***

### getResolvedModuleWithFailedLookupLocationsFromCache()?

> `optional` **getResolvedModuleWithFailedLookupLocationsFromCache**(`modulename`, `containingFile`, `resolutionMode?`): `undefined` \| [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6245

#### Parameters

##### modulename

`string`

##### containingFile

`string`

##### resolutionMode?

[`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

#### Returns

`undefined` \| [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)

***

### getScriptFileNames()

> **getScriptFileNames**(): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6226

#### Returns

`string`[]

***

### getScriptKind()?

> `optional` **getScriptKind**(`fileName`): [`ScriptKind`](../enumerations/ScriptKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6227

#### Parameters

##### fileName

`string`

#### Returns

[`ScriptKind`](../enumerations/ScriptKind.md)

***

### getScriptSnapshot()

> **getScriptSnapshot**(`fileName`): `undefined` \| [`IScriptSnapshot`](IScriptSnapshot.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6229

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`IScriptSnapshot`](IScriptSnapshot.md)

***

### getScriptVersion()

> **getScriptVersion**(`fileName`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6228

#### Parameters

##### fileName

`string`

#### Returns

`string`

***

### getTypeRootsVersion()?

> `optional` **getTypeRootsVersion**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6243

#### Returns

`number`

***

### installPackage()?

> `optional` **installPackage**(`options`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6253

#### Parameters

##### options

[`InstallPackageOptions`](InstallPackageOptions.md)

#### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

***

### isKnownTypesPackageName()?

> `optional` **isKnownTypesPackageName**(`name`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6252

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### log()?

> `optional` **log**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6235

#### Parameters

##### s

`string`

#### Returns

`void`

***

### readDirectory()?

> `optional` **readDirectory**(`path`, `extensions?`, `exclude?`, `include?`, `depth?`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6239

#### Parameters

##### path

`string`

##### extensions?

readonly `string`[]

##### exclude?

readonly `string`[]

##### include?

readonly `string`[]

##### depth?

`number`

#### Returns

`string`[]

***

### readFile()

> **readFile**(`path`, `encoding?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6241

#### Parameters

##### path

`string`

##### encoding?

`string`

#### Returns

`undefined` \| `string`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`readFile`](MinimalResolutionCacheHost.md#readfile)

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6240

Resolve a symbolic link.

#### Parameters

##### path

`string`

#### Returns

`string`

#### See

https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`realpath`](MinimalResolutionCacheHost.md#realpath)

***

### resolveModuleNames()?

> `optional` **resolveModuleNames**(`moduleNames`, `containingFile`, `reusedNames`, `redirectedReference`, `options`, `containingSourceFile?`): (`undefined` \| [`ResolvedModule`](ResolvedModule.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6244

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

> `optional` **resolveTypeReferenceDirectives**(`typeDirectiveNames`, `containingFile`, `redirectedReference`, `options`, `containingFileMode?`): (`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6246

#### Parameters

##### typeDirectiveNames

`string`[] | [`FileReference`](FileReference.md)[]

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

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6236

#### Parameters

##### s

`string`

#### Returns

`void`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`trace`](MinimalResolutionCacheHost.md#trace)

***

### useCaseSensitiveFileNames()?

> `optional` **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6238

#### Returns

`boolean`

#### Overrides

`MinimalResolutionCacheHost.useCaseSensitiveFileNames`

***

### writeFile()?

> `optional` **writeFile**(`fileName`, `content`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6254

#### Parameters

##### fileName

`string`

##### content

`string`

#### Returns

`void`
