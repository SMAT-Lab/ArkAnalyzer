[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / LoadPagEdge

# Class: LoadPagEdge

Defined in: src/callgraph/pointerAnalysis/Pag.ts:110

## Extends

- [`PagEdge`](PagEdge.md)

## Constructors

### Constructor

> **new LoadPagEdge**(`n`, `d`, `s`): `LoadPagEdge`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:111

#### Parameters

##### n

[`PagNode`](PagNode.md)

##### d

[`PagNode`](PagNode.md)

##### s

[`Stmt`](Stmt.md)

#### Returns

`LoadPagEdge`

#### Overrides

[`PagEdge`](PagEdge.md).[`constructor`](PagEdge.md#constructor)

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:22

#### Inherited from

[`PagEdge`](PagEdge.md).[`kind`](PagEdge.md#kind)

## Methods

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:75

#### Returns

`string`

#### Inherited from

[`PagEdge`](PagEdge.md).[`getDotAttr`](PagEdge.md#getdotattr)

***

### getDstID()

> **getDstID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:34

#### Returns

`number`

#### Inherited from

[`PagEdge`](PagEdge.md).[`getDstID`](PagEdge.md#getdstid)

***

### getDstNode()

> **getDstNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:42

#### Returns

[`BaseNode`](BaseNode.md)

#### Inherited from

[`PagEdge`](PagEdge.md).[`getDstNode`](PagEdge.md#getdstnode)

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

[`PagEdge`](PagEdge.md).[`getEndPoints`](PagEdge.md#getendpoints)

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:46

#### Returns

`number`

#### Inherited from

[`PagEdge`](PagEdge.md).[`getKind`](PagEdge.md#getkind)

***

### getSrcID()

> **getSrcID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:30

#### Returns

`number`

#### Inherited from

[`PagEdge`](PagEdge.md).[`getSrcID`](PagEdge.md#getsrcid)

***

### getSrcNode()

> **getSrcNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:38

#### Returns

[`BaseNode`](BaseNode.md)

#### Inherited from

[`PagEdge`](PagEdge.md).[`getSrcNode`](PagEdge.md#getsrcnode)

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

[`PagEdge`](PagEdge.md).[`setKind`](PagEdge.md#setkind)
