[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / visitNodes

# Function: visitNodes()

## Call Signature

> **visitNodes**\<`T`\>(`nodes`, `visitor`, `test?`, `start?`, `count?`): [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5472

Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### nodes

[`NodeArray`](../interfaces/NodeArray.md)\<`T`\>

The NodeArray to visit.

#### visitor

The callback used to visit a Node.

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

A node test to execute for each node.

#### start?

`number`

An optional value indicating the starting offset at which to start visiting.

#### count?

`number`

An optional value indicating the maximum number of nodes to visit.

### Returns

[`NodeArray`](../interfaces/NodeArray.md)\<`T`\>

## Call Signature

> **visitNodes**\<`T`\>(`nodes`, `visitor`, `test?`, `start?`, `count?`): `undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5482

Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### nodes

The NodeArray to visit.

`undefined` | [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>

#### visitor

The callback used to visit a Node.

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

A node test to execute for each node.

#### start?

`number`

An optional value indicating the starting offset at which to start visiting.

#### count?

`number`

An optional value indicating the maximum number of nodes to visit.

### Returns

`undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<`T`\>
