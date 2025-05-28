[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / visitEachChild

# Function: visitEachChild()

## Call Signature

> **visitEachChild**\<`T`\>(`node`, `visitor`, `context`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5520

Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

`T`

The Node whose children will be visited.

#### visitor

[`Visitor`](../type-aliases/Visitor.md)

The callback used to visit each child.

#### context

[`TransformationContext`](../interfaces/TransformationContext.md)

A lexical environment context for the visitor.

### Returns

`T`

## Call Signature

> **visitEachChild**\<`T`\>(`node`, `visitor`, `context`, `nodesVisitor?`, `tokenVisitor?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5528

Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

The Node whose children will be visited.

`undefined` | `T`

#### visitor

[`Visitor`](../type-aliases/Visitor.md)

The callback used to visit each child.

#### context

[`TransformationContext`](../interfaces/TransformationContext.md)

A lexical environment context for the visitor.

#### nodesVisitor?

\{\<`T`\>(`nodes`, `visitor`, `test?`, `start?`, `count?`): [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>; \<`T`\>(`nodes`, `visitor`, `test?`, `start?`, `count?`): `undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>; \}

#### tokenVisitor?

[`Visitor`](../type-aliases/Visitor.md)

### Returns

`undefined` \| `T`
