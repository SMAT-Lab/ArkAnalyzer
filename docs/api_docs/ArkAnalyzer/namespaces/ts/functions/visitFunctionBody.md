[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / visitFunctionBody

# Function: visitFunctionBody()

## Call Signature

> **visitFunctionBody**(`node`, `visitor`, `context`): [`Block`](../interfaces/Block.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5498

Resumes a suspended lexical environment and visits a function body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

#### node

[`Block`](../interfaces/Block.md)

#### visitor

[`Visitor`](../type-aliases/Visitor.md)

#### context

[`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

[`Block`](../interfaces/Block.md)

## Call Signature

> **visitFunctionBody**(`node`, `visitor`, `context`): `undefined` \| [`Block`](../interfaces/Block.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5503

Resumes a suspended lexical environment and visits a function body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

#### node

`undefined` | [`Block`](../interfaces/Block.md)

#### visitor

[`Visitor`](../type-aliases/Visitor.md)

#### context

[`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

`undefined` \| [`Block`](../interfaces/Block.md)

## Call Signature

> **visitFunctionBody**(`node`, `visitor`, `context`): [`ConciseBody`](../type-aliases/ConciseBody.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5508

Resumes a suspended lexical environment and visits a concise body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

#### node

[`ConciseBody`](../type-aliases/ConciseBody.md)

#### visitor

[`Visitor`](../type-aliases/Visitor.md)

#### context

[`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

[`ConciseBody`](../type-aliases/ConciseBody.md)
