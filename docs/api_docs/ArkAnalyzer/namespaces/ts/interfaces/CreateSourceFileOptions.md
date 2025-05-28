[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CreateSourceFileOptions

# Interface: CreateSourceFileOptions

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5230

## Properties

### impliedNodeFormat?

> `optional` **impliedNodeFormat**: [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5237

Controls the format the file is detected as - this can be derived from only the path
and files on disk, but needs to be done with a module resolution cache in scope to be performant.
This is usually `undefined` for compilations that do not have `moduleResolution` values of `node16` or `nodenext`.

***

### languageVersion

> **languageVersion**: [`ScriptTarget`](../enumerations/ScriptTarget.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5231

***

### setExternalModuleIndicator()?

> `optional` **setExternalModuleIndicator**: (`file`) => `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5243

Controls how module-y-ness is set for the given file. Usually the result of calling
`getSetExternalModuleIndicator` on a valid `CompilerOptions` object. If not present, the default
check specified by `isFileProbablyExternalModule` will be used to set the field.

#### Parameters

##### file

[`SourceFile`](SourceFile.md)

#### Returns

`void`
