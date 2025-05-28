[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createSemanticDiagnosticsBuilderProgram

# Function: createSemanticDiagnosticsBuilderProgram()

## Call Signature

> **createSemanticDiagnosticsBuilderProgram**(`newProgram`, `host`, `oldProgram?`, `configFileParsingDiagnostics?`): [`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5758

Create the builder to manage semantic diagnostics and cache them

### Parameters

#### newProgram

[`Program`](../interfaces/Program.md)

#### host

[`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

#### oldProgram?

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

## Call Signature

> **createSemanticDiagnosticsBuilderProgram**(`rootNames`, `options`, `host?`, `oldProgram?`, `configFileParsingDiagnostics?`, `projectReferences?`): [`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5759

Create the builder to manage semantic diagnostics and cache them

### Parameters

#### rootNames

`undefined` | readonly `string`[]

#### options

`undefined` | [`CompilerOptions`](../interfaces/CompilerOptions.md)

#### host?

[`CompilerHost`](../interfaces/CompilerHost.md)

#### oldProgram?

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

#### projectReferences?

readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)
