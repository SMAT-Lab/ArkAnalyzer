[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PagEdge

# Class: PagEdge

Defined in: src/callgraph/pointerAnalysis/Pag.ts:67

## Extends

- [`BaseEdge`](BaseEdge.md)

## Extended by

- [`AddrPagEdge`](AddrPagEdge.md)
- [`CopyPagEdge`](CopyPagEdge.md)
- [`LoadPagEdge`](LoadPagEdge.md)
- [`WritePagEdge`](WritePagEdge.md)
- [`ThisPagEdge`](ThisPagEdge.md)

## Constructors

### Constructor

> **new PagEdge**(`n`, `d`, `k`, `s?`): `PagEdge`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:70

#### Parameters

##### n

[`PagNode`](PagNode.md)

##### d

[`PagNode`](PagNode.md)

##### k

[`PagEdgeKind`](../enumerations/PagEdgeKind.md)

##### s?

[`Stmt`](Stmt.md)

#### Returns

`PagEdge`

#### Overrides

[`BaseEdge`](BaseEdge.md).[`constructor`](BaseEdge.md#constructor)

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:22

#### Inherited from

[`BaseEdge`](BaseEdge.md).[`kind`](BaseEdge.md#kind)

## Methods

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:75

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
