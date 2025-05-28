[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getParsedCommandLineOfConfigFile

# Function: getParsedCommandLineOfConfigFile()

> **getParsedCommandLineOfConfigFile**(`configFileName`, `optionsToExtend`, `host`, `extendedConfigCache?`, `watchOptionsToExtend?`, `extraFileExtensions?`): `undefined` \| [`ParsedCommandLine`](../interfaces/ParsedCommandLine.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5278

Reads the config file, reports errors if any and exits if the config file cannot be found

## Parameters

### configFileName

`string`

### optionsToExtend

`undefined` | [`CompilerOptions`](../interfaces/CompilerOptions.md)

### host

[`ParseConfigFileHost`](../interfaces/ParseConfigFileHost.md)

### extendedConfigCache?

[`Map`](../interfaces/Map.md)\<[`ExtendedConfigCacheEntry`](../interfaces/ExtendedConfigCacheEntry.md)\>

### watchOptionsToExtend?

[`WatchOptions`](../interfaces/WatchOptions.md)

### extraFileExtensions?

readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

## Returns

`undefined` \| [`ParsedCommandLine`](../interfaces/ParsedCommandLine.md)
