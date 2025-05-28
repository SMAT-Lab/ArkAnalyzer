[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / BaseEdge

# Class: `abstract` BaseEdge

Defined in: src/core/graph/BaseExplicitGraph.ts:19

## Extended by

- [`CallGraphEdge`](CallGraphEdge.md)
- [`PagEdge`](PagEdge.md)

## Constructors

### Constructor

> **new BaseEdge**(`s`, `d`, `k`): `BaseEdge`

Defined in: src/core/graph/BaseExplicitGraph.ts:24

#### Parameters

##### s

[`BaseNode`](BaseNode.md)

##### d

[`BaseNode`](BaseNode.md)

##### k

`number`

#### Returns

`BaseEdge`

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:22

## Methods

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/core/graph/BaseExplicitGraph.ts:61

#### Returns

`string`

***

### getDstID()

> **getDstID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:34

#### Returns

`number`

***

### getDstNode()

> **getDstNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:42

#### Returns

[`BaseNode`](BaseNode.md)

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

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:46

#### Returns

`number`

***

### getSrcID()

> **getSrcID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:30

#### Returns

`number`

***

### getSrcNode()

> **getSrcNode**(): [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:38

#### Returns

[`BaseNode`](BaseNode.md)

***

### setKind()

> **setKind**(`kind`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:50

#### Parameters

##### kind

`number`

#### Returns

`void`
