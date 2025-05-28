[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getParseTreeNode

# Function: getParseTreeNode()

## Call Signature

> **getParseTreeNode**(`node`): `undefined` \| [`Node`](../interfaces/Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4711

Gets the original parse tree node for a node.

### Parameters

#### node

The original node.

`undefined` | [`Node`](../interfaces/Node.md)

### Returns

`undefined` \| [`Node`](../interfaces/Node.md)

The original parse tree node if found; otherwise, undefined.

## Call Signature

> **getParseTreeNode**\<`T`\>(`node`, `nodeTest?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4719

Gets the original parse tree node for a node.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

The original node.

`undefined` | `T`

#### nodeTest?

(`node`) => `node is T`

A callback used to ensure the correct type of parse tree node is returned.

### Returns

`undefined` \| `T`

The original parse tree node if found; otherwise, undefined.
