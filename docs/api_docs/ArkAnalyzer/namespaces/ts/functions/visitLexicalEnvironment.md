[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / visitLexicalEnvironment

# Function: visitLexicalEnvironment()

> **visitLexicalEnvironment**(`statements`, `visitor`, `context`, `start?`, `ensureUseStrict?`, `nodesVisitor?`): [`NodeArray`](../interfaces/NodeArray.md)\<[`Statement`](../interfaces/Statement.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5487

Starts a new lexical environment and visits a statement list, ending the lexical environment
and merging hoisted declarations upon completion.

## Parameters

### statements

[`NodeArray`](../interfaces/NodeArray.md)\<[`Statement`](../interfaces/Statement.md)\>

### visitor

[`Visitor`](../type-aliases/Visitor.md)

### context

[`TransformationContext`](../interfaces/TransformationContext.md)

### start?

`number`

### ensureUseStrict?

`boolean`

### nodesVisitor?

[`NodesVisitor`](../interfaces/NodesVisitor.md)

## Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`Statement`](../interfaces/Statement.md)\>
