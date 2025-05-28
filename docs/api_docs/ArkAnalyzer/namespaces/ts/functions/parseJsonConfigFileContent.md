[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / parseJsonConfigFileContent

# Function: parseJsonConfigFileContent()

> **parseJsonConfigFileContent**(`json`, `host`, `basePath`, `existingOptions?`, `configFileName?`, `resolutionStack?`, `extraFileExtensions?`, `extendedConfigCache?`, `existingWatchOptions?`): [`ParsedCommandLine`](../interfaces/ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5312

Parse the contents of a config file (tsconfig.json).

## Parameters

### json

`any`

The contents of the config file to parse

### host

[`ParseConfigHost`](../interfaces/ParseConfigHost.md)

Instance of ParseConfigHost used to enumerate files in folder.

### basePath

`string`

A root directory to resolve relative path entries in the config
   file to. e.g. outDir

### existingOptions?

[`CompilerOptions`](../interfaces/CompilerOptions.md)

### configFileName?

`string`

### resolutionStack?

[`Path`](../type-aliases/Path.md)[]

### extraFileExtensions?

readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

### extendedConfigCache?

[`Map`](../interfaces/Map.md)\<[`ExtendedConfigCacheEntry`](../interfaces/ExtendedConfigCacheEntry.md)\>

### existingWatchOptions?

[`WatchOptions`](../interfaces/WatchOptions.md)

## Returns

[`ParsedCommandLine`](../interfaces/ParsedCommandLine.md)
