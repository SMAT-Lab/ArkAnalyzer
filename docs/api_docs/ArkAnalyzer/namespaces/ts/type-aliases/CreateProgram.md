[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CreateProgram

# Type Alias: CreateProgram()\<T\>

> **CreateProgram**\<`T`\> = (`rootNames`, `options`, `host?`, `oldProgram?`, `configFileParsingDiagnostics?`, `projectReferences?`) => `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5794

Create the program with rootNames and options, if they are undefined, oldProgram and new configFile diagnostics create new program

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

## Parameters

### rootNames

readonly `string`[] | `undefined`

### options

[`CompilerOptions`](../interfaces/CompilerOptions.md) | `undefined`

### host?

[`CompilerHost`](../interfaces/CompilerHost.md)

### oldProgram?

`T`

### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### projectReferences?

readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

## Returns

`T`
