[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / findAncestor

# Function: findAncestor()

## Call Signature

> **findAncestor**\<`T`\>(`node`, `callback`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4697

Iterates through the parent chain of a node and performs the callback on each parent until the callback
returns a truthy value, then returns that value.
If no such value is found, it applies the callback until the parent pointer is undefined or the callback returns "quit"
At that point findAncestor returns undefined.

### Type Parameters

#### T

`T` *extends* [`Node`](../interfaces/Node.md)

### Parameters

#### node

`undefined` | [`Node`](../interfaces/Node.md)

#### callback

(`element`) => `element is T`

### Returns

`undefined` \| `T`

## Call Signature

> **findAncestor**(`node`, `callback`): `undefined` \| [`Node`](../interfaces/Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4698

Iterates through the parent chain of a node and performs the callback on each parent until the callback
returns a truthy value, then returns that value.
If no such value is found, it applies the callback until the parent pointer is undefined or the callback returns "quit"
At that point findAncestor returns undefined.

### Parameters

#### node

`undefined` | [`Node`](../interfaces/Node.md)

#### callback

(`element`) => `boolean` \| `"quit"`

### Returns

`undefined` \| [`Node`](../interfaces/Node.md)
