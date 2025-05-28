[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createWatchCompilerHost

# Function: createWatchCompilerHost()

## Call Signature

> **createWatchCompilerHost**\<`T`\>(`configFileName`, `optionsToExtend`, `system`, `createProgram?`, `reportDiagnostic?`, `reportWatchStatus?`, `watchOptionsToExtend?`, `extraFileExtensions?`): [`WatchCompilerHostOfConfigFile`](../interfaces/WatchCompilerHostOfConfigFile.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5909

Create the watch compiler host for either configFile or fileNames and its options

### Type Parameters

#### T

`T` *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

#### configFileName

`string`

#### optionsToExtend

`undefined` | [`CompilerOptions`](../interfaces/CompilerOptions.md)

#### system

[`System`](../interfaces/System.md)

#### createProgram?

[`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

#### reportDiagnostic?

[`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

#### reportWatchStatus?

[`WatchStatusReporter`](../type-aliases/WatchStatusReporter.md)

#### watchOptionsToExtend?

[`WatchOptions`](../interfaces/WatchOptions.md)

#### extraFileExtensions?

readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

### Returns

[`WatchCompilerHostOfConfigFile`](../interfaces/WatchCompilerHostOfConfigFile.md)\<`T`\>

## Call Signature

> **createWatchCompilerHost**\<`T`\>(`rootFiles`, `options`, `system`, `createProgram?`, `reportDiagnostic?`, `reportWatchStatus?`, `projectReferences?`, `watchOptions?`): [`WatchCompilerHostOfFilesAndCompilerOptions`](../interfaces/WatchCompilerHostOfFilesAndCompilerOptions.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5910

Create the watch compiler host for either configFile or fileNames and its options

### Type Parameters

#### T

`T` *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

#### rootFiles

`string`[]

#### options

[`CompilerOptions`](../interfaces/CompilerOptions.md)

#### system

[`System`](../interfaces/System.md)

#### createProgram?

[`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

#### reportDiagnostic?

[`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

#### reportWatchStatus?

[`WatchStatusReporter`](../type-aliases/WatchStatusReporter.md)

#### projectReferences?

readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

#### watchOptions?

[`WatchOptions`](../interfaces/WatchOptions.md)

### Returns

[`WatchCompilerHostOfFilesAndCompilerOptions`](../interfaces/WatchCompilerHostOfFilesAndCompilerOptions.md)\<`T`\>
