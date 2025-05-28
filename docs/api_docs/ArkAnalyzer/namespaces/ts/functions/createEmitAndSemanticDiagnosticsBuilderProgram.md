[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createEmitAndSemanticDiagnosticsBuilderProgram

# Function: createEmitAndSemanticDiagnosticsBuilderProgram()

## Call Signature

> **createEmitAndSemanticDiagnosticsBuilderProgram**(`newProgram`, `host`, `oldProgram?`, `configFileParsingDiagnostics?`): [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5764

Create the builder that can handle the changes in program and iterate through changed files
to emit the those files and manage semantic diagnostics cache as well

### Parameters

#### newProgram

[`Program`](../interfaces/Program.md)

#### host

[`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

#### oldProgram?

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

## Call Signature

> **createEmitAndSemanticDiagnosticsBuilderProgram**(`rootNames`, `options`, `host?`, `oldProgram?`, `configFileParsingDiagnostics?`, `projectReferences?`): [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5765

Create the builder that can handle the changes in program and iterate through changed files
to emit the those files and manage semantic diagnostics cache as well

### Parameters

#### rootNames

`undefined` | readonly `string`[]

#### options

`undefined` | [`CompilerOptions`](../interfaces/CompilerOptions.md)

#### host?

[`CompilerHost`](../interfaces/CompilerHost.md)

#### oldProgram?

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

#### projectReferences?

readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)
