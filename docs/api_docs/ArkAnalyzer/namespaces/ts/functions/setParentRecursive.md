[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / setParentRecursive

# Function: setParentRecursive()

## Call Signature

> **setParentRecursive**\<`T`\>(`rootNode`, `incremental`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4919

Bypasses immutability and directly sets the `parent` property of each `Node` recursively.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### rootNode

`T`

The root node from which to start the recursion.

#### incremental

`boolean`

When `true`, only recursively descends through nodes whose `parent` pointers are incorrect.
This allows us to quickly bail out of setting `parent` for subtrees during incremental parsing.

### Returns

`T`

## Call Signature

> **setParentRecursive**\<`T`\>(`rootNode`, `incremental`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4920

Bypasses immutability and directly sets the `parent` property of each `Node` recursively.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### rootNode

The root node from which to start the recursion.

`undefined` | `T`

#### incremental

`boolean`

When `true`, only recursively descends through nodes whose `parent` pointers are incorrect.
This allows us to quickly bail out of setting `parent` for subtrees during incremental parsing.

### Returns

`undefined` \| `T`
