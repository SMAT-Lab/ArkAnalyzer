[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createSolutionBuilderHost

# Function: createSolutionBuilderHost()

> **createSolutionBuilderHost**\<`T`\>(`system?`, `createProgram?`, `reportDiagnostic?`, `reportSolutionBuilderStatus?`, `reportErrorSummary?`): [`SolutionBuilderHost`](../interfaces/SolutionBuilderHost.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5967

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md) = [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

## Parameters

### system?

[`System`](../interfaces/System.md)

### createProgram?

[`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

### reportDiagnostic?

[`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

### reportSolutionBuilderStatus?

[`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

### reportErrorSummary?

[`ReportEmitErrorSummary`](../type-aliases/ReportEmitErrorSummary.md)

## Returns

[`SolutionBuilderHost`](../interfaces/SolutionBuilderHost.md)\<`T`\>
