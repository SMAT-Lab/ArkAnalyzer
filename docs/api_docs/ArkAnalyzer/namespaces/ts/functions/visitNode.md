[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / visitNode

# Function: visitNode()

## Call Signature

> **visitNode**\<`T`\>(`node`, `visitor`, `test?`, `lift?`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5453

Visits a Node using the supplied visitor, possibly returning a new Node in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

`T`

The Node to visit.

#### visitor

The callback used to visit the Node.

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

A callback to execute to verify the Node is valid.

#### lift?

(`node`) => `T`

An optional callback to execute to lift a NodeArray into a valid Node.

### Returns

`T`

## Call Signature

> **visitNode**\<`T`\>(`node`, `visitor`, `test?`, `lift?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5462

Visits a Node using the supplied visitor, possibly returning a new Node in its place.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

The Node to visit.

`undefined` | `T`

#### visitor

The callback used to visit the Node.

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

A callback to execute to verify the Node is valid.

#### lift?

(`node`) => `T`

An optional callback to execute to lift a NodeArray into a valid Node.

### Returns

`undefined` \| `T`
