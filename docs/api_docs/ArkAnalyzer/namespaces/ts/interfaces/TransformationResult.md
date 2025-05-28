[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TransformationResult

# Interface: TransformationResult\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4133

## Type Parameters

### T

`T` *extends* [`Node`](Node.md)

## Properties

### diagnostics?

> `optional` **diagnostics**: [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4137

Gets diagnostics for the transformation.

***

### transformed

> **transformed**: `T`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4135

Gets the transformed source files.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4162

Clean up EmitNode entries on any parse-tree nodes.

#### Returns

`void`

***

### emitNodeWithNotification()

> **emitNodeWithNotification**(`hint`, `node`, `emitCallback`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4152

Emits a node with possible notification.

#### Parameters

##### hint

[`EmitHint`](../enumerations/EmitHint.md)

A hint as to the intended usage of the node.

##### node

[`Node`](Node.md)

The node to emit.

##### emitCallback

(`hint`, `node`) => `void`

A callback used to emit the node.

#### Returns

`void`

***

### isEmitNotificationEnabled()?

> `optional` **isEmitNotificationEnabled**(`node`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4158

Indicates if a given node needs an emit notification

#### Parameters

##### node

[`Node`](Node.md)

The node to emit.

#### Returns

`boolean`

***

### substituteNode()

> **substituteNode**(`hint`, `node`): [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4144

Gets a substitute for a node, if one is available; otherwise, returns the original node.

#### Parameters

##### hint

[`EmitHint`](../enumerations/EmitHint.md)

A hint as to the intended usage of the node.

##### node

[`Node`](Node.md)

The node to substitute.

#### Returns

[`Node`](Node.md)
