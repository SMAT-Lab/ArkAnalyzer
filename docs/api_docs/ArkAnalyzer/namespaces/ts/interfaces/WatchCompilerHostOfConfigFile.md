[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / WatchCompilerHostOfConfigFile

# Interface: WatchCompilerHostOfConfigFile\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5875

Host to create watch with config file

## Extends

- [`WatchCompilerHost`](WatchCompilerHost.md)\<`T`\>.[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md)

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### configFileName

> **configFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5877

Name of the config file to compile

***

### createProgram

> **createProgram**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5812

Used to create the program when need for program creation or recreation detected

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`createProgram`](WatchCompilerHost.md#createprogram)

***

### extraFileExtensions?

> `optional` **extraFileExtensions**: readonly [`FileExtensionInfo`](FileExtensionInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5881

***

### onUnRecoverableConfigFileDiagnostic

> **onUnRecoverableConfigFileDiagnostic**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5267

Reports unrecoverable error when parsing config file

#### Inherited from

[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md).[`onUnRecoverableConfigFileDiagnostic`](ConfigFileDiagnosticsReporter.md#onunrecoverableconfigfilediagnostic)

***

### optionsToExtend?

> `optional` **optionsToExtend**: [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5879

Options to extend

***

### watchOptionsToExtend?

> `optional` **watchOptionsToExtend**: [`WatchOptions`](WatchOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5880

## Methods

### afterProgramCreate()?

> `optional` **afterProgramCreate**(`program`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5858

If provided, callback to invoke after every new program creation

#### Parameters

##### program

`T`

#### Returns

`void`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`afterProgramCreate`](WatchCompilerHost.md#afterprogramcreate)

***

### clearTimeout()?

> `optional` **clearTimeout**(`timeoutId`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5806

If provided, will be used to reset existing delayed compilation

#### Parameters

##### timeoutId

`any`

#### Returns

`void`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`clearTimeout`](WatchCompilerHost.md#cleartimeout)

***

### createHash()?

> `optional` **createHash**(`data`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5818

#### Parameters

##### data

`string`

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`createHash`](WatchCompilerHost.md#createhash)

***

### directoryExists()?

> `optional` **directoryExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5830

If provided, used for module resolution as well as to handle directory structure

#### Parameters

##### path

`string`

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`directoryExists`](WatchCompilerHost.md#directoryexists)

***

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5823

Use to check file presence for source files and
if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well

#### Parameters

##### path

`string`

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`fileExists`](WatchCompilerHost.md#fileexists)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5815

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getCurrentDirectory`](WatchCompilerHost.md#getcurrentdirectory)

***

### getDefaultLibFileName()

> **getDefaultLibFileName**(`options`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5816

#### Parameters

##### options

[`CompilerOptions`](CompilerOptions.md)

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDefaultLibFileName`](WatchCompilerHost.md#getdefaultlibfilename)

***

### getDefaultLibLocation()?

> `optional` **getDefaultLibLocation**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5817

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDefaultLibLocation`](WatchCompilerHost.md#getdefaultliblocation)

***

### getDirectories()?

> `optional` **getDirectories**(`path`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5832

If provided, used in resolutions as well as handling directory structure

#### Parameters

##### path

`string`

#### Returns

`string`[]

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDirectories`](WatchCompilerHost.md#getdirectories)

***

### getEnvironmentVariable()?

> `optional` **getEnvironmentVariable**(`name`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5840

If provided is used to get the environment variable

#### Parameters

##### name

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getEnvironmentVariable`](WatchCompilerHost.md#getenvironmentvariable)

***

### getModuleResolutionCache()?

> `optional` **getModuleResolutionCache**(): `undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5850

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getModuleResolutionCache`](WatchCompilerHost.md#getmoduleresolutioncache)

***

### getNewLine()

> **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5814

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getNewLine`](WatchCompilerHost.md#getnewline)

***

### getParsedCommandLine()?

> `optional` **getParsedCommandLine**(`fileName`): `undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5856

If provided, use this method to get parsed command lines for referenced projects

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getParsedCommandLine`](WatchCompilerHost.md#getparsedcommandline)

***

### hasInvalidatedResolutions()?

> `optional` **hasInvalidatedResolutions**(`filePath`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5846

If provided along with custom resolveModuleNames or resolveTypeReferenceDirectives, used to determine if unchanged file path needs to re-resolve modules/type reference directives

#### Parameters

##### filePath

[`Path`](../type-aliases/Path.md)

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`hasInvalidatedResolutions`](WatchCompilerHost.md#hasinvalidatedresolutions)

***

### onWatchStatusChange()?

> `optional` **onWatchStatusChange**(`diagnostic`, `newLine`, `options`, `errorCount?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5798

If provided, called with Diagnostic message that informs about change in watch status

#### Parameters

##### diagnostic

[`Diagnostic`](Diagnostic.md)

##### newLine

`string`

##### options

[`CompilerOptions`](CompilerOptions.md)

##### errorCount?

`number`

#### Returns

`void`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`onWatchStatusChange`](WatchCompilerHost.md#onwatchstatuschange)

***

### readDirectory()

> **readDirectory**(`path`, `extensions?`, `exclude?`, `include?`, `depth?`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5886

Used to generate source file names from the config file and its include, exclude, files rules
and also to cache the directory stucture

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

#### Overrides

[`WatchCompilerHost`](WatchCompilerHost.md).[`readDirectory`](WatchCompilerHost.md#readdirectory)

***

### readFile()

> **readFile**(`path`, `encoding?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5828

Use to read file text for source files and
if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well

#### Parameters

##### path

`string`

##### encoding?

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`readFile`](WatchCompilerHost.md#readfile)

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5836

Symbol links resolution

#### Parameters

##### path

`string`

#### Returns

`string`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`realpath`](WatchCompilerHost.md#realpath)

***

### resolveModuleNames()?

> `optional` **resolveModuleNames**(`moduleNames`, `containingFile`, `reusedNames`, `redirectedReference`, `options`, `containingSourceFile?`): (`undefined` \| [`ResolvedModule`](ResolvedModule.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5842

If provided, used to resolve the module names, otherwise typescript's default module resolution

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

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveModuleNames`](WatchCompilerHost.md#resolvemodulenames)

***

### resolveTypeReferenceDirectives()?

> `optional` **resolveTypeReferenceDirectives**(`typeReferenceDirectiveNames`, `containingFile`, `redirectedReference`, `options`, `containingFileMode?`): (`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5844

If provided, used to resolve type reference directives, otherwise typescript's default resolution

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

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveTypeReferenceDirectives`](WatchCompilerHost.md#resolvetypereferencedirectives)

***

### setTimeout()?

> `optional` **setTimeout**(`callback`, `ms`, ...`args`): `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5804

If provided, will be used to set delayed compilation, so that multiple changes in short span are compiled together

#### Parameters

##### callback

(...`args`) => `void`

##### ms

`number`

##### args

...`any`[]

#### Returns

`any`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`setTimeout`](WatchCompilerHost.md#settimeout)

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5838

If provided would be used to write log about compilation

#### Parameters

##### s

`string`

#### Returns

`void`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`trace`](WatchCompilerHost.md#trace)

***

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5813

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`useCaseSensitiveFileNames`](WatchCompilerHost.md#usecasesensitivefilenames)

***

### useSourceOfProjectReferenceRedirect()?

> `optional` **useSourceOfProjectReferenceRedirect**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5854

Instead of using output d.ts file from project reference, use its source file

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`useSourceOfProjectReferenceRedirect`](WatchCompilerHost.md#usesourceofprojectreferenceredirect)

***

### watchDirectory()

> **watchDirectory**(`path`, `callback`, `recursive?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5802

Used to watch resolved module's failed lookup locations, config file specs, type roots where auto type reference directives are added

#### Parameters

##### path

`string`

##### callback

[`DirectoryWatcherCallback`](../type-aliases/DirectoryWatcherCallback.md)

##### recursive?

`boolean`

##### options?

[`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`watchDirectory`](WatchCompilerHost.md#watchdirectory)

***

### watchFile()

> **watchFile**(`path`, `callback`, `pollingInterval?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5800

Used to watch changes in source files, missing files needed to update the program or config file

#### Parameters

##### path

`string`

##### callback

[`FileWatcherCallback`](../type-aliases/FileWatcherCallback.md)

##### pollingInterval?

`number`

##### options?

[`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`watchFile`](WatchCompilerHost.md#watchfile)
