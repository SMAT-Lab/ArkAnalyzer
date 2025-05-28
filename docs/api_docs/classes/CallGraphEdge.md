[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CallGraphEdge

# Class: CallGraphEdge

Defined in: src/callgraph/model/CallGraph.ts:41

## Extends

- [`BaseEdge`](BaseEdge.md)

## Constructors

### Constructor

> **new CallGraphEdge**(`src`, `dst`): `CallGraphEdge`

Defined in: src/callgraph/model/CallGraph.ts:47

#### Parameters

##### src

[`CallGraphNode`](CallGraphNode.md)

##### dst

[`CallGraphNode`](CallGraphNode.md)

#### Returns

`CallGraphEdge`

#### Overrides

[`BaseEdge`](BaseEdge.md).[`constructor`](BaseEdge.md#constructor)

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:22

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`kind`](BaseEdge.md#kind)

## Methods

### addDirectCallSite()

> **addDirectCallSite**(`stmt`): `void`

Defined in: src/callgraph/model/CallGraph.ts:51

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### addInDirectCallSite()

> **addInDirectCallSite**(`stmt`): `void`

Defined in: src/callgraph/model/CallGraph.ts:59

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### addSpecialCallSite()

> **addSpecialCallSite**(`stmt`): `void`

Defined in: src/callgraph/model/CallGraph.ts:55

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/model/CallGraph.ts:63

#### Returns

`string`

#### Overrides

[`BaseEdge`](BaseEdge.md).[`getDotAttr`](BaseEdge.md#getdotattr)

***

### getDstID()

> **getDstID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:34

#### Returns

`number`

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getDstID`](BaseEdge.md#getdstid)

***

### getDstNode()

> **getDstNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:42

#### Returns

[`BaseNode`](BaseNode.md)

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getDstNode`](BaseEdge.md#getdstnode)

***

### getEndPoints()

> **getEndPoints**(): `object`

Defined in: src/core/graph/BaseExplicitGraph.ts:54

#### Returns

`object`

##### dst

> **dst**: `number`

##### src

> **src**: `number`

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getEndPoints`](BaseEdge.md#getendpoints)

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:46

#### Returns

`number`

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getKind`](BaseEdge.md#getkind)

***

### getSrcID()

> **getSrcID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:30

#### Returns

`number`

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getSrcID`](BaseEdge.md#getsrcid)

***

### getSrcNode()

> **getSrcNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:38

#### Returns

[`BaseNode`](BaseNode.md)

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`getSrcNode`](BaseEdge.md#getsrcnode)

***

### setKind()

> **setKind**(`kind`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:50

#### Parameters

##### kind

`number`

#### Returns

`void`

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`setKind`](BaseEdge.md#setkind)
