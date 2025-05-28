[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / WatchCompilerHost

# Interface: WatchCompilerHost\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5852

Host that has watch functionality used in --watch mode

## Extends

- [`ProgramHost`](ProgramHost.md)\<`T`\>.[`WatchHost`](WatchHost.md)

## Extended by

- [`WatchCompilerHostOfFilesAndCompilerOptions`](WatchCompilerHostOfFilesAndCompilerOptions.md)
- [`WatchCompilerHostOfConfigFile`](WatchCompilerHostOfConfigFile.md)

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### createProgram

> **createProgram**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5812

Used to create the program when need for program creation or recreation detected

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`createProgram`](ProgramHost.md#createprogram)

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

[`WatchHost`](WatchHost.md).[`clearTimeout`](WatchHost.md#cleartimeout)

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

[`ProgramHost`](ProgramHost.md).[`createHash`](ProgramHost.md#createhash)

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

[`ProgramHost`](ProgramHost.md).[`directoryExists`](ProgramHost.md#directoryexists)

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

[`ProgramHost`](ProgramHost.md).[`fileExists`](ProgramHost.md#fileexists)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5815

#### Returns

`string`

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`getCurrentDirectory`](ProgramHost.md#getcurrentdirectory)

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

[`ProgramHost`](ProgramHost.md).[`getDefaultLibFileName`](ProgramHost.md#getdefaultlibfilename)

***

### getDefaultLibLocation()?

> `optional` **getDefaultLibLocation**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5817

#### Returns

`string`

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`getDefaultLibLocation`](ProgramHost.md#getdefaultliblocation)

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

[`ProgramHost`](ProgramHost.md).[`getDirectories`](ProgramHost.md#getdirectories)

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

[`ProgramHost`](ProgramHost.md).[`getEnvironmentVariable`](ProgramHost.md#getenvironmentvariable)

***

### getModuleResolutionCache()?

> `optional` **getModuleResolutionCache**(): `undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5850

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`getModuleResolutionCache`](ProgramHost.md#getmoduleresolutioncache)

***

### getNewLine()

> **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5814

#### Returns

`string`

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`getNewLine`](ProgramHost.md#getnewline)

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

[`ProgramHost`](ProgramHost.md).[`hasInvalidatedResolutions`](ProgramHost.md#hasinvalidatedresolutions)

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

[`WatchHost`](WatchHost.md).[`onWatchStatusChange`](WatchHost.md#onwatchstatuschange)

***

### readDirectory()?

> `optional` **readDirectory**(`path`, `extensions?`, `exclude?`, `include?`, `depth?`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5834

If provided, used to cache and handle directory structure modifications

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

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`readDirectory`](ProgramHost.md#readdirectory)

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

[`ProgramHost`](ProgramHost.md).[`readFile`](ProgramHost.md#readfile)

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

[`ProgramHost`](ProgramHost.md).[`realpath`](ProgramHost.md#realpath)

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

[`ProgramHost`](ProgramHost.md).[`resolveModuleNames`](ProgramHost.md#resolvemodulenames)

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

[`ProgramHost`](ProgramHost.md).[`resolveTypeReferenceDirectives`](ProgramHost.md#resolvetypereferencedirectives)

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

[`WatchHost`](WatchHost.md).[`setTimeout`](WatchHost.md#settimeout)

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

[`ProgramHost`](ProgramHost.md).[`trace`](ProgramHost.md#trace)

***

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5813

#### Returns

`boolean`

#### Inherited from

[`ProgramHost`](ProgramHost.md).[`useCaseSensitiveFileNames`](ProgramHost.md#usecasesensitivefilenames)

***

### useSourceOfProjectReferenceRedirect()?

> `optional` **useSourceOfProjectReferenceRedirect**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5854

Instead of using output d.ts file from project reference, use its source file

#### Returns

`boolean`

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

[`WatchHost`](WatchHost.md).[`watchDirectory`](WatchHost.md#watchdirectory)

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

[`WatchHost`](WatchHost.md).[`watchFile`](WatchHost.md#watchfile)
