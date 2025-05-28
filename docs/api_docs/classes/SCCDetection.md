[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / SCCDetection

# Class: SCCDetection\<Graph\>

Defined in: src/core/graph/Scc.ts:60

Detect strongly connected components in a directed graph
A topological graph is an extra product from this algorithm
Advanced Nuutila’s algorithm which come from the following paper:
  Wave Propagation and Deep Propagation for pointer Analysis
  CGO 2009

## Type Parameters

### Graph

`Graph` *extends* `GraphTraits`\<[`BaseNode`](BaseNode.md)\>

## Constructors

### Constructor

> **new SCCDetection**\<`Graph`\>(`GT`): `SCCDetection`\<`Graph`\>

Defined in: src/core/graph/Scc.ts:84

#### Parameters

##### GT

`Graph`

#### Returns

`SCCDetection`\<`Graph`\>

## Methods

### find()

> **find**(): `void`

Defined in: src/core/graph/Scc.ts:218

Start to detect and collapse SCC

#### Returns

`void`

***

### getMySCCNodes()

> **getMySCCNodes**(`n`): `NodeSet`

Defined in: src/core/graph/Scc.ts:255

#### Parameters

##### n

`number`

#### Returns

`NodeSet`

***

### getNode2SCCInfoMap()

> **getNode2SCCInfoMap**(): `Node2RepSCCInfoMap`

Defined in: src/core/graph/Scc.ts:233

#### Returns

`Node2RepSCCInfoMap`

***

### getRepNode()

> **getRepNode**(`n`): `number`

Defined in: src/core/graph/Scc.ts:206

Get the rep node
If not found return itself

#### Parameters

##### n

`number`

#### Returns

`number`

***

### getRepNodes()

> **getRepNodes**(): `NodeSet`

Defined in: src/core/graph/Scc.ts:275

#### Returns

`NodeSet`

***

### getSubNodes()

> **getSubNodes**(`n`): `NodeSet`

Defined in: src/core/graph/Scc.ts:261

#### Parameters

##### n

`number`

#### Returns

`NodeSet`

***

### getTopoAndCollapsedNodeStack()

> **getTopoAndCollapsedNodeStack**(): `NodeStack`

Defined in: src/core/graph/Scc.ts:229

#### Returns

`NodeStack`

***

### nodeIsInCycle()

> **nodeIsInCycle**(`n`): `boolean`

Defined in: src/core/graph/Scc.ts:238

#### Parameters

##### n

`number`

#### Returns

`boolean`
