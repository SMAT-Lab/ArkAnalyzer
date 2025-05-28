[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getAutomaticTypeDirectiveNames

# Function: getAutomaticTypeDirectiveNames()

> **getAutomaticTypeDirectiveNames**(`options`, `host`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5361

Given a set of options, returns the set of type directive names
  that should be included for this program automatically.
This list could either come from the config file,
  or from enumerating the types root + initial secondary types lookup location.
More type directives might appear in the program later as a result of loading actual source files;
  this list is only the set of defaults that are implicitly included.

## Parameters

### options

[`CompilerOptions`](../interfaces/CompilerOptions.md)

### host

[`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

## Returns

`string`[]
