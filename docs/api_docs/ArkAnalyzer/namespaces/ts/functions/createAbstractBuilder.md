[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createAbstractBuilder

# Function: createAbstractBuilder()

## Call Signature

> **createAbstractBuilder**(`newProgram`, `host`, `oldProgram?`, `configFileParsingDiagnostics?`): [`BuilderProgram`](../interfaces/BuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5770

Creates a builder thats just abstraction over program and can be used with watch

### Parameters

#### newProgram

[`Program`](../interfaces/Program.md)

#### host

[`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

#### oldProgram?

[`BuilderProgram`](../interfaces/BuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`BuilderProgram`](../interfaces/BuilderProgram.md)

## Call Signature

> **createAbstractBuilder**(`rootNames`, `options`, `host?`, `oldProgram?`, `configFileParsingDiagnostics?`, `projectReferences?`): [`BuilderProgram`](../interfaces/BuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5771

Creates a builder thats just abstraction over program and can be used with watch

### Parameters

#### rootNames

`undefined` | readonly `string`[]

#### options

`undefined` | [`CompilerOptions`](../interfaces/CompilerOptions.md)

#### host?

[`CompilerHost`](../interfaces/CompilerHost.md)

#### oldProgram?

[`BuilderProgram`](../interfaces/BuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

#### projectReferences?

readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`BuilderProgram`](../interfaces/BuilderProgram.md)
