[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / DocumentRegistry

# Interface: DocumentRegistry

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7337

The document registry represents a store of SourceFile objects that can be shared between
multiple LanguageService instances. A LanguageService instance holds on the SourceFile (AST)
of files in the context.
SourceFile objects account for most of the memory usage by the language service. Sharing
the same DocumentRegistry instance between different instances of LanguageService allow
for more efficient memory utilization since all projects will share at least the library
file (lib.d.ts).

A more advanced use of the document registry is to serialize sourceFile objects to disk
and re-hydrate them when needed.

To create a default DocumentRegistry, use createDocumentRegistry to create one, and pass it
to all subsequent createLanguageService calls.

## Methods

### acquireDocument()

> **acquireDocument**(`fileName`, `compilationSettingsOrHost`, `scriptSnapshot`, `version`, `scriptKind?`, `sourceFileOptions?`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7355

Request a stored SourceFile with a given fileName and compilationSettings.
The first call to acquire will call createLanguageServiceSourceFile to generate
the SourceFile if was not found in the registry.

#### Parameters

##### fileName

`string`

The name of the file requested

##### compilationSettingsOrHost

Some compilation settings like target affects the
shape of a the resulting SourceFile. This allows the DocumentRegistry to store
multiple copies of the same file for different compilation settings. A minimal
resolution cache is needed to fully define a source file's shape when
the compilation settings include `module: node16`+, so providing a cache host
object should be preferred. A common host is a language service `ConfiguredProject`.

[`CompilerOptions`](CompilerOptions.md) | [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

##### scriptSnapshot

[`IScriptSnapshot`](IScriptSnapshot.md)

Text of the file. Only used if the file was not found
in the registry and a new one was created.

##### version

`string`

Current version of the file. Only used if the file was not found
in the registry and a new one was created.

##### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### sourceFileOptions?

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

***

### acquireDocumentWithKey()

> **acquireDocumentWithKey**(`fileName`, `path`, `compilationSettingsOrHost`, `key`, `scriptSnapshot`, `version`, `scriptKind?`, `sourceFileOptions?`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7356

#### Parameters

##### fileName

`string`

##### path

[`Path`](../type-aliases/Path.md)

##### compilationSettingsOrHost

[`CompilerOptions`](CompilerOptions.md) | [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

##### key

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

##### scriptSnapshot

[`IScriptSnapshot`](IScriptSnapshot.md)

##### version

`string`

##### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### sourceFileOptions?

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

***

### getKeyForCompilationSettings()

> **getKeyForCompilationSettings**(`settings`): [`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7374

#### Parameters

##### settings

[`CompilerOptions`](CompilerOptions.md)

#### Returns

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

***

### releaseDocument()

#### Call Signature

> **releaseDocument**(`fileName`, `compilationSettings`, `scriptKind?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7386

##### Parameters

###### fileName

`string`

###### compilationSettings

[`CompilerOptions`](CompilerOptions.md)

###### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### Returns

`void`

##### Deprecated

pass scriptKind and impliedNodeFormat for correctness

#### Call Signature

> **releaseDocument**(`fileName`, `compilationSettings`, `scriptKind`, `impliedNodeFormat`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7398

Informs the DocumentRegistry that a file is not needed any longer.

Note: It is not allowed to call release on a SourceFile that was not acquired from
this registry originally.

##### Parameters

###### fileName

`string`

The name of the file to be released

###### compilationSettings

[`CompilerOptions`](CompilerOptions.md)

The compilation settings used to acquire the file

###### scriptKind

[`ScriptKind`](../enumerations/ScriptKind.md)

The script kind of the file to be released

###### impliedNodeFormat

The implied source file format of the file to be released

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

##### Returns

`void`

***

### releaseDocumentWithKey()

#### Call Signature

> **releaseDocumentWithKey**(`path`, `key`, `scriptKind?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7401

##### Parameters

###### path

[`Path`](../type-aliases/Path.md)

###### key

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

###### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### Returns

`void`

##### Deprecated

pass scriptKind for and impliedNodeFormat correctness

#### Call Signature

> **releaseDocumentWithKey**(`path`, `key`, `scriptKind`, `impliedNodeFormat`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7402

##### Parameters

###### path

[`Path`](../type-aliases/Path.md)

###### key

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

###### scriptKind

[`ScriptKind`](../enumerations/ScriptKind.md)

###### impliedNodeFormat

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

##### Returns

`void`

***

### reportStats()

> **reportStats**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7403

#### Returns

`string`

***

### updateDocument()

> **updateDocument**(`fileName`, `compilationSettingsOrHost`, `scriptSnapshot`, `version`, `scriptKind?`, `sourceFileOptions?`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7372

Request an updated version of an already existing SourceFile with a given fileName
and compilationSettings. The update will in-turn call updateLanguageServiceSourceFile
to get an updated SourceFile.

#### Parameters

##### fileName

`string`

The name of the file requested

##### compilationSettingsOrHost

Some compilation settings like target affects the
shape of a the resulting SourceFile. This allows the DocumentRegistry to store
multiple copies of the same file for different compilation settings. A minimal
resolution cache is needed to fully define a source file's shape when
the compilation settings include `module: node16`+, so providing a cache host
object should be preferred. A common host is a language service `ConfiguredProject`.

[`CompilerOptions`](CompilerOptions.md) | [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

##### scriptSnapshot

[`IScriptSnapshot`](IScriptSnapshot.md)

Text of the file.

##### version

`string`

Current version of the file.

##### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### sourceFileOptions?

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

***

### updateDocumentWithKey()

> **updateDocumentWithKey**(`fileName`, `path`, `compilationSettingsOrHost`, `key`, `scriptSnapshot`, `version`, `scriptKind?`, `sourceFileOptions?`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7373

#### Parameters

##### fileName

`string`

##### path

[`Path`](../type-aliases/Path.md)

##### compilationSettingsOrHost

[`CompilerOptions`](CompilerOptions.md) | [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

##### key

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

##### scriptSnapshot

[`IScriptSnapshot`](IScriptSnapshot.md)

##### version

`string`

##### scriptKind?

[`ScriptKind`](../enumerations/ScriptKind.md)

##### sourceFileOptions?

[`ScriptTarget`](../enumerations/ScriptTarget.md) | [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)
