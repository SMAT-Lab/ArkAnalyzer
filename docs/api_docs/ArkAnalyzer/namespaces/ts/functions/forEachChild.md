[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / forEachChild

# Function: forEachChild()

> **forEachChild**\<`T`\>(`node`, `cbNode`, `cbNodes?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5229

Invokes a callback for each child of the given node. The 'cbNode' callback is invoked for all child nodes
stored in properties. If a 'cbNodes' callback is specified, it is invoked for embedded arrays; otherwise,
embedded arrays are flattened and the 'cbNode' callback is invoked for each element. If a callback returns
a truthy value, iteration stops and that value is returned. Otherwise, undefined is returned.

## Type Parameters

### T

`T`

## Parameters

### node

[`Node`](../interfaces/Node.md)

a given node to visit its children

### cbNode

(`node`) => `undefined` \| `T`

a callback to be invoked for all child nodes

### cbNodes?

(`nodes`) => `undefined` \| `T`

a callback to be invoked for embedded array

## Returns

`undefined` \| `T`

## Remarks

`forEachChild` must visit the children of a node in the order
that they appear in the source code. The language service depends on this property to locate nodes by position.
