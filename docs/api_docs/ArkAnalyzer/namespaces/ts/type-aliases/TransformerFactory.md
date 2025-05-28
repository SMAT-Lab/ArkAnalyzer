[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TransformerFactory

# Type Alias: TransformerFactory()\<T\>

> **TransformerFactory**\<`T`\> = (`context`) => [`Transformer`](Transformer.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4168

A function that is used to initialize and return a `Transformer` callback, which in turn
will be used to transform one or more nodes.

## Type Parameters

### T

`T` *extends* [`Node`](../interfaces/Node.md)

## Parameters

### context

[`TransformationContext`](../interfaces/TransformationContext.md)

## Returns

[`Transformer`](Transformer.md)\<`T`\>
