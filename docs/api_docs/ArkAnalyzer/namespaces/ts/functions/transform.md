[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / transform

# Function: transform()

> **transform**\<`T`\>(`source`, `transformers`, `compilerOptions?`): [`TransformationResult`](../interfaces/TransformationResult.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7454

Transform one or more nodes using the supplied transformers.

## Type Parameters

### T

`T` *extends* [`Node`](../interfaces/Node.md)

## Parameters

### source

A single `Node` or an array of `Node` objects.

`T` | `T`[]

### transformers

[`TransformerFactory`](../type-aliases/TransformerFactory.md)\<`T`\>[]

An array of `TransformerFactory` callbacks used to process the transformation.

### compilerOptions?

[`CompilerOptions`](../interfaces/CompilerOptions.md)

Optional compiler options.

## Returns

[`TransformationResult`](../interfaces/TransformationResult.md)\<`T`\>
