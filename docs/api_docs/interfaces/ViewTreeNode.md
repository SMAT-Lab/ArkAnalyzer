[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ViewTreeNode

# Interface: ViewTreeNode

Defined in: src/core/graph/ViewTree.ts:28

## Properties

### attributes

> **attributes**: `Map`\<`string`, \[[`Stmt`](../classes/Stmt.md), ([`Constant`](../classes/Constant.md) \| [`MethodSignature`](../classes/MethodSignature.md) \| [`ArkInstanceFieldRef`](../classes/ArkInstanceFieldRef.md))[]\]\>

Defined in: src/core/graph/ViewTree.ts:34

Component attribute stmts, key is attribute name, value is [Stmt, [Uses Values]].

***

### builder?

> `optional` **builder**: [`MethodSignature`](../classes/MethodSignature.md)

Defined in: src/core/graph/ViewTree.ts:59

builderParam bind builder method signature.

***

### builderParam?

> `optional` **builderParam**: [`ArkField`](../classes/ArkField.md)

Defined in: src/core/graph/ViewTree.ts:56

BuilderParam placeholders ArkField.

***

### children

> **children**: `ViewTreeNode`[]

Defined in: src/core/graph/ViewTree.ts:40

Node's children.

***

### ~~classSignature?~~

> `optional` **classSignature**: [`MethodSignature`](../classes/MethodSignature.md) \| [`ClassSignature`](../classes/ClassSignature.md)

Defined in: src/core/graph/ViewTree.ts:42

#### Deprecated

Use [signature](#signature) instead.

***

### name

> **name**: `string`

Defined in: src/core/graph/ViewTree.ts:30

Component node name

***

### parent

> **parent**: `null` \| `ViewTreeNode`

Defined in: src/core/graph/ViewTree.ts:38

Node's parent, CustomComponent and root node no parent.

***

### signature?

> `optional` **signature**: [`MethodSignature`](../classes/MethodSignature.md) \| [`ClassSignature`](../classes/ClassSignature.md)

Defined in: src/core/graph/ViewTree.ts:44

CustomComponent class signature or Builder method signature.

***

### stateValues

> **stateValues**: `Set`\<[`ArkField`](../classes/ArkField.md)\>

Defined in: src/core/graph/ViewTree.ts:36

Used state values.

***

### stateValuesTransfer?

> `optional` **stateValuesTransfer**: `Map`\<[`ArkField`](../classes/ArkField.md), [`ArkField`](../classes/ArkField.md) \| [`ArkMethod`](../classes/ArkMethod.md)\>

Defined in: src/core/graph/ViewTree.ts:53

Custom component value transfer
- key: ArkField, child custom component class stateValue field.
- value: ArkField | ArkMethod, parent component transfer value.
    key is BuilderParam, the value is Builder ArkMethod.
    Others, the value is parent class stateValue field.

***

### ~~stmts~~

> **stmts**: `Map`\<`string`, \[[`Stmt`](../classes/Stmt.md), ([`Constant`](../classes/Constant.md) \| [`MethodSignature`](../classes/MethodSignature.md) \| [`ArkInstanceFieldRef`](../classes/ArkInstanceFieldRef.md))[]\]\>

Defined in: src/core/graph/ViewTree.ts:32

#### Deprecated

Use [attributes](#attributes) instead.

## Methods

### isBuilder()

> **isBuilder**(): `boolean`

Defined in: src/core/graph/ViewTree.ts:74

Whether the node type is Builder.

#### Returns

`boolean`

true: node is Builder, false others.

***

### isCustomComponent()

> **isCustomComponent**(): `boolean`

Defined in: src/core/graph/ViewTree.ts:80

Whether the node type is custom component.

#### Returns

`boolean`

true: node is custom component, false others.

***

### walk()

> **walk**(`selector`): `boolean`

Defined in: src/core/graph/ViewTree.ts:68

walk node and node's children

#### Parameters

##### selector

(`item`) => `boolean`

Node selector function, return true skipping the follow-up nodes.

#### Returns

`boolean`

- true: There are nodes that meet the selector.
 - false: does not exist.
