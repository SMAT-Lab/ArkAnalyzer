[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CustomTransformers

# Interface: CustomTransformers

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2346

## Properties

### after?

> `optional` **after**: ([`CustomTransformerFactory`](../type-aliases/CustomTransformerFactory.md) \| [`TransformerFactory`](../type-aliases/TransformerFactory.md)\<[`SourceFile`](SourceFile.md)\>)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2350

Custom transformers to evaluate after built-in .js transformations.

***

### afterDeclarations?

> `optional` **afterDeclarations**: ([`CustomTransformerFactory`](../type-aliases/CustomTransformerFactory.md) \| [`TransformerFactory`](../type-aliases/TransformerFactory.md)\<[`SourceFile`](SourceFile.md) \| [`Bundle`](Bundle.md)\>)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2352

Custom transformers to evaluate after built-in .d.ts transformations.

***

### before?

> `optional` **before**: ([`CustomTransformerFactory`](../type-aliases/CustomTransformerFactory.md) \| [`TransformerFactory`](../type-aliases/TransformerFactory.md)\<[`SourceFile`](SourceFile.md)\>)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2348

Custom transformers to evaluate before built-in .js transformations.
