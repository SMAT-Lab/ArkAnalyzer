[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SolutionBuilderHost

# Interface: SolutionBuilderHost\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5951

## Extends

- [`SolutionBuilderHostBase`](SolutionBuilderHostBase.md)\<`T`\>

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### createProgram

> **createProgram**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5812

Used to create the program when need for program creation or recreation detected

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createProgram`](SolutionBuilderHostBase.md#createprogram)

***

### getCustomTransformers()?

> `optional` **getCustomTransformers**: (`project`) => `undefined` \| [`CustomTransformers`](CustomTransformers.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5942

#### Parameters

##### project

`string`

#### Returns

`undefined` \| [`CustomTransformers`](CustomTransformers.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getCustomTransformers`](SolutionBuilderHostBase.md#getcustomtransformers)

***

### reportDiagnostic

> **reportDiagnostic**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5947

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`reportDiagnostic`](SolutionBuilderHostBase.md#reportdiagnostic)

***

### reportErrorSummary?

> `optional` **reportErrorSummary**: [`ReportEmitErrorSummary`](../type-aliases/ReportEmitErrorSummary.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5952

***

### reportSolutionBuilderStatus

> **reportSolutionBuilderStatus**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5948

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`reportSolutionBuilderStatus`](SolutionBuilderHostBase.md#reportsolutionbuilderstatus)

## Methods

### afterProgramEmitAndDiagnostics()?

> `optional` **afterProgramEmitAndDiagnostics**(`program`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5949

#### Parameters

##### program

`T`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`afterProgramEmitAndDiagnostics`](SolutionBuilderHostBase.md#afterprogramemitanddiagnostics)

***

### createDirectory()?

> `optional` **createDirectory**(`path`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5936

#### Parameters

##### path

`string`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createDirectory`](SolutionBuilderHostBase.md#createdirectory)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createHash`](SolutionBuilderHostBase.md#createhash)

***

### deleteFile()

> **deleteFile**(`fileName`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5945

#### Parameters

##### fileName

`string`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`deleteFile`](SolutionBuilderHostBase.md#deletefile)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`directoryExists`](SolutionBuilderHostBase.md#directoryexists)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`fileExists`](SolutionBuilderHostBase.md#fileexists)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5815

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getCurrentDirectory`](SolutionBuilderHostBase.md#getcurrentdirectory)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDefaultLibFileName`](SolutionBuilderHostBase.md#getdefaultlibfilename)

***

### getDefaultLibLocation()?

> `optional` **getDefaultLibLocation**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5817

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDefaultLibLocation`](SolutionBuilderHostBase.md#getdefaultliblocation)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDirectories`](SolutionBuilderHostBase.md#getdirectories)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getEnvironmentVariable`](SolutionBuilderHostBase.md#getenvironmentvariable)

***

### getModifiedTime()

> **getModifiedTime**(`fileName`): `undefined` \| `Date`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5943

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `Date`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getModifiedTime`](SolutionBuilderHostBase.md#getmodifiedtime)

***

### getModuleResolutionCache()?

> `optional` **getModuleResolutionCache**(): `undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5850

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getModuleResolutionCache`](SolutionBuilderHostBase.md#getmoduleresolutioncache)

***

### getNewLine()

> **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5814

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getNewLine`](SolutionBuilderHostBase.md#getnewline)

***

### getParsedCommandLine()?

> `optional` **getParsedCommandLine**(`fileName`): `undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5946

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getParsedCommandLine`](SolutionBuilderHostBase.md#getparsedcommandline)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`hasInvalidatedResolutions`](SolutionBuilderHostBase.md#hasinvalidatedresolutions)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`readDirectory`](SolutionBuilderHostBase.md#readdirectory)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`readFile`](SolutionBuilderHostBase.md#readfile)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`realpath`](SolutionBuilderHostBase.md#realpath)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveModuleNames`](SolutionBuilderHostBase.md#resolvemodulenames)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveTypeReferenceDirectives`](SolutionBuilderHostBase.md#resolvetypereferencedirectives)

***

### setModifiedTime()

> **setModifiedTime**(`fileName`, `date`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5944

#### Parameters

##### fileName

`string`

##### date

`Date`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`setModifiedTime`](SolutionBuilderHostBase.md#setmodifiedtime)

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

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`trace`](SolutionBuilderHostBase.md#trace)

***

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5813

#### Returns

`boolean`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`useCaseSensitiveFileNames`](SolutionBuilderHostBase.md#usecasesensitivefilenames)

***

### writeFile()?

> `optional` **writeFile**(`path`, `data`, `writeByteOrderMark?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5941

Should provide create directory and writeFile if done of invalidatedProjects is not invoked with
writeFileCallback

#### Parameters

##### path

`string`

##### data

`string`

##### writeByteOrderMark?

`boolean`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`writeFile`](SolutionBuilderHostBase.md#writefile)
