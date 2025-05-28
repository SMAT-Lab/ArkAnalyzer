[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DVFG

# Class: DVFG

Defined in: src/VFG/DVFG.ts:25

Direct value flow graph
Consist of stmt(node) and direct Def-Use edge
Is basic of VFG. And VFG is building on DVFG

## Extends

- [`BaseExplicitGraph`](BaseExplicitGraph.md)

## Constructors

### Constructor

> **new DVFG**(`cg`): `DVFG`

Defined in: src/VFG/DVFG.ts:28

#### Parameters

##### cg

[`CallGraph`](CallGraph.md)

#### Returns

`DVFG`

#### Overrides

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`constructor`](BaseExplicitGraph.md#constructor)

## Properties

### edgeMarkSet

> `protected` **edgeMarkSet**: `Set`\<`string`\>

Defined in: src/core/graph/BaseExplicitGraph.ts:140

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`edgeMarkSet`](BaseExplicitGraph.md#edgemarkset)

***

### edgeNum

> `protected` **edgeNum**: `number` = `0`

Defined in: src/core/graph/BaseExplicitGraph.ts:137

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`edgeNum`](BaseExplicitGraph.md#edgenum)

***

### idToNodeMap

> `protected` **idToNodeMap**: `Map`\<`number`, [`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:139

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`idToNodeMap`](BaseExplicitGraph.md#idtonodemap)

***

### nodeNum

> `protected` **nodeNum**: `number` = `0`

Defined in: src/core/graph/BaseExplicitGraph.ts:138

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`nodeNum`](BaseExplicitGraph.md#nodenum)

## Methods

### addDVFGEdge()

> **addDVFGEdge**(`src`, `dst`): `boolean`

Defined in: src/VFG/DVFG.ts:68

#### Parameters

##### src

`DVFGNode`

##### dst

`DVFGNode`

#### Returns

`boolean`

***

### addDVFGNode()

> **addDVFGNode**(`stmt`, `kind`): `DVFGNode`

Defined in: src/VFG/DVFG.ts:59

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### kind

`DVFGNodeKind`

#### Returns

`DVFGNode`

***

### addNode()

> **addNode**(`n`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:155

#### Parameters

##### n

[`BaseNode`](BaseNode.md)

#### Returns

`void`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`addNode`](BaseExplicitGraph.md#addnode)

***

### dump()

> **dump**(`name`): `void`

Defined in: src/VFG/DVFG.ts:81

#### Parameters

##### name

`string`

#### Returns

`void`

***

### getCG()

> **getCG**(): [`CallGraph`](CallGraph.md)

Defined in: src/VFG/DVFG.ts:34

#### Returns

[`CallGraph`](CallGraph.md)

***

### getGraphName()

> **getGraphName**(): `string`

Defined in: src/VFG/DVFG.ts:38

#### Returns

`string`

#### Overrides

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getGraphName`](BaseExplicitGraph.md#getgraphname)

***

### getNode()

> **getNode**(`id`): `undefined` \| [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:160

#### Parameters

##### id

`number`

#### Returns

`undefined` \| [`BaseNode`](BaseNode.md)

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getNode`](BaseExplicitGraph.md#getnode)

***

### getNodeNum()

> **getNodeNum**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:147

#### Returns

`number`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getNodeNum`](BaseExplicitGraph.md#getnodenum)

***

### getNodesIter()

> **getNodesIter**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:200

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getNodesIter`](BaseExplicitGraph.md#getnodesiter)

***

### getOrNewDVFGNode()

> **getOrNewDVFGNode**(`stmt`): `DVFGNode`

Defined in: src/VFG/DVFG.ts:42

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`DVFGNode`

***

### hasEdge()

> **hasEdge**(`src`, `dst`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:180

#### Parameters

##### src

[`BaseNode`](BaseNode.md)

##### dst

[`BaseNode`](BaseNode.md)

#### Returns

`boolean`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`hasEdge`](BaseExplicitGraph.md#hasedge)

***

### hasNode()

> **hasNode**(`id`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:168

#### Parameters

##### id

`number`

#### Returns

`boolean`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`hasNode`](BaseExplicitGraph.md#hasnode)

***

### ifEdgeExisting()

> **ifEdgeExisting**(`edge`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:190

#### Parameters

##### edge

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`ifEdgeExisting`](BaseExplicitGraph.md#ifedgeexisting)

***

### nodesItor()

> **nodesItor**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:151

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`nodesItor`](BaseExplicitGraph.md#nodesitor)

***

### removeNode()

> **removeNode**(`id`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:172

#### Parameters

##### id

`number`

#### Returns

`boolean`

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`removeNode`](BaseExplicitGraph.md#removenode)
