[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getMutableClone

# Variable: ~~getMutableClone()~~

> `const` **getMutableClone**: \<`T`\>(`node`) => `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8314

Creates a shallow, memberwise clone of a node ~for mutation~ with its `pos`, `end`, and `parent` set.

NOTE: It is unsafe to change any properties of a `Node` that relate to its AST children, as those changes won't be
captured with respect to transformations.

## Type Parameters

### T

`T` *extends* [`Node`](../interfaces/Node.md)

## Parameters

### node

`T`

## Returns

`T`

## Deprecated

Use an appropriate `factory.update...` method instead, use `setCommentRange` or `setSourceMapRange`, and avoid setting `parent`.
