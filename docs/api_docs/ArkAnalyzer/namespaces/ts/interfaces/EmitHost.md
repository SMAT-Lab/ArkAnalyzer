[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / EmitHost

# Interface: EmitHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3584

## Extends

- [`ScriptReferenceHost`](ScriptReferenceHost.md).[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`SourceFileMayBeEmittedHost`](SourceFileMayBeEmittedHost.md)

## Properties

### getSourceFileFromReference()

> **getSourceFileFromReference**: (`referencingFile`, `ref`) => `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3595

#### Parameters

##### referencingFile

[`SourceFile`](SourceFile.md) | [`UnparsedSource`](UnparsedSource.md)

##### ref

[`FileReference`](FileReference.md)

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### redirectTargetsMap

> `readonly` **redirectTargetsMap**: [`RedirectTargetsMap`](../type-aliases/RedirectTargetsMap.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3596

#### Overrides

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`redirectTargetsMap`](ModuleSpecifierResolutionHost.md#redirecttargetsmap)

***

### writeFile

> **writeFile**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3594

## Methods

### createHash()?

> `optional` **createHash**(`data`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3597

#### Parameters

##### data

`string`

#### Returns

`string`

***

### directoryExists()?

> `optional` **directoryExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4344

#### Parameters

##### path

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`directoryExists`](ModuleSpecifierResolutionHost.md#directoryexists)

***

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4342

#### Parameters

##### path

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`fileExists`](ModuleSpecifierResolutionHost.md#fileexists)

***

### getCanonicalFileName()

> **getCanonicalFileName**(`fileName`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3590

#### Parameters

##### fileName

`string`

#### Returns

`string`

***

### getCommonSourceDirectory()

> **getCommonSourceDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3589

#### Returns

`string`

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2231

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`SourceFileMayBeEmittedHost`](SourceFileMayBeEmittedHost.md).[`getCompilerOptions`](SourceFileMayBeEmittedHost.md#getcompileroptions)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3587

#### Returns

`string`

#### Overrides

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getCurrentDirectory`](ModuleSpecifierResolutionHost.md#getcurrentdirectory)

***

### getGlobalTypingsCacheLocation()?

> `optional` **getGlobalTypingsCacheLocation**(): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4349

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getGlobalTypingsCacheLocation`](ModuleSpecifierResolutionHost.md#getglobaltypingscachelocation)

***

### getLibFileFromReference()

> **getLibFileFromReference**(`ref`): `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3588

#### Parameters

##### ref

[`FileReference`](FileReference.md)

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

***

### getModuleSpecifierCache()?

> `optional` **getModuleSpecifierCache**(): [`ModuleSpecifierCache`](ModuleSpecifierCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4347

#### Returns

[`ModuleSpecifierCache`](ModuleSpecifierCache.md)

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getModuleSpecifierCache`](ModuleSpecifierResolutionHost.md#getmodulespecifiercache)

***

### getNearestAncestorDirectoryWithPackageJson()?

> `optional` **getNearestAncestorDirectoryWithPackageJson**(`fileName`, `rootDir?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4350

#### Parameters

##### fileName

`string`

##### rootDir?

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getNearestAncestorDirectoryWithPackageJson`](ModuleSpecifierResolutionHost.md#getnearestancestordirectorywithpackagejson)

***

### getNewLine()

> **getNewLine**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3591

#### Returns

`string`

***

### getPackageJsonInfoCache()?

> `optional` **getPackageJsonInfoCache**(): `undefined` \| [`PackageJsonInfoCache`](PackageJsonInfoCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4348

#### Returns

`undefined` \| [`PackageJsonInfoCache`](PackageJsonInfoCache.md)

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getPackageJsonInfoCache`](ModuleSpecifierResolutionHost.md#getpackagejsoninfocache)

***

### getPrependNodes()

> **getPrependNodes**(): readonly ([`InputFiles`](InputFiles.md) \| [`UnparsedSource`](UnparsedSource.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3593

#### Returns

readonly ([`InputFiles`](InputFiles.md) \| [`UnparsedSource`](UnparsedSource.md))[]

***

### getProjectReferenceRedirect()

> **getProjectReferenceRedirect**(`fileName`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4352

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`getProjectReferenceRedirect`](ModuleSpecifierResolutionHost.md#getprojectreferenceredirect)

***

### getResolvedProjectReferenceToRedirect()

> **getResolvedProjectReferenceToRedirect**(`fileName`): `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3581

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Inherited from

[`SourceFileMayBeEmittedHost`](SourceFileMayBeEmittedHost.md).[`getResolvedProjectReferenceToRedirect`](SourceFileMayBeEmittedHost.md#getresolvedprojectreferencetoredirect)

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

### getSourceFiles()

> **getSourceFiles**(): readonly [`SourceFile`](SourceFile.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3585

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

***

### isEmitBlocked()

> **isEmitBlocked**(`emitFileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3592

#### Parameters

##### emitFileName

`string`

#### Returns

`boolean`

***

### isSourceFileFromExternalLibrary()

> **isSourceFileFromExternalLibrary**(`file`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3580

#### Parameters

##### file

[`SourceFile`](SourceFile.md)

#### Returns

`boolean`

#### Inherited from

[`SourceFileMayBeEmittedHost`](SourceFileMayBeEmittedHost.md).[`isSourceFileFromExternalLibrary`](SourceFileMayBeEmittedHost.md#issourcefilefromexternallibrary)

***

### isSourceOfProjectReferenceRedirect()

> **isSourceOfProjectReferenceRedirect**(`fileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4353

#### Parameters

##### fileName

`string`

#### Returns

`boolean`

#### Inherited from

[`SourceFileMayBeEmittedHost`](SourceFileMayBeEmittedHost.md).[`isSourceOfProjectReferenceRedirect`](SourceFileMayBeEmittedHost.md#issourceofprojectreferenceredirect)

***

### readFile()?

> `optional` **readFile**(`path`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4345

#### Parameters

##### path

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`readFile`](ModuleSpecifierResolutionHost.md#readfile)

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4346

#### Parameters

##### path

`string`

#### Returns

`string`

#### Inherited from

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`realpath`](ModuleSpecifierResolutionHost.md#realpath)

***

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3586

#### Returns

`boolean`

#### Overrides

[`ModuleSpecifierResolutionHost`](ModuleSpecifierResolutionHost.md).[`useCaseSensitiveFileNames`](ModuleSpecifierResolutionHost.md#usecasesensitivefilenames)
