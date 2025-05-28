[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createProgram

# Function: createProgram()

## Call Signature

> **createProgram**(`createProgramOptions`): [`Program`](../interfaces/Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5603

Create a new 'Program' instance. A Program is an immutable collection of 'SourceFile's and a 'CompilerOptions'
that represent a compilation unit.

Creating a program proceeds from a set of root files, expanding the set of inputs by following imports and
triple-slash-reference-path directives transitively. '@types' and triple-slash-reference-types are also pulled in.

### Parameters

#### createProgramOptions

[`CreateProgramOptions`](../interfaces/CreateProgramOptions.md)

The options for creating a program.

### Returns

[`Program`](../interfaces/Program.md)

A 'Program' object.

## Call Signature

> **createProgram**(`rootNames`, `options`, `host?`, `oldProgram?`, `configFileParsingDiagnostics?`): [`Program`](../interfaces/Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5618

Create a new 'Program' instance. A Program is an immutable collection of 'SourceFile's and a 'CompilerOptions'
that represent a compilation unit.

Creating a program proceeds from a set of root files, expanding the set of inputs by following imports and
triple-slash-reference-path directives transitively. '@types' and triple-slash-reference-types are also pulled in.

### Parameters

#### rootNames

readonly `string`[]

A set of root files.

#### options

[`CompilerOptions`](../interfaces/CompilerOptions.md)

The compiler options which should be used.

#### host?

[`CompilerHost`](../interfaces/CompilerHost.md)

The host interacts with the underlying file system.

#### oldProgram?

[`Program`](../interfaces/Program.md)

Reuses an old program structure.

#### configFileParsingDiagnostics?

readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

error during config file parsing

### Returns

[`Program`](../interfaces/Program.md)

A 'Program' object.
