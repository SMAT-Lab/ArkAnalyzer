[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / BaseExplicitGraph

# Class: `abstract` BaseExplicitGraph

Defined in: src/core/graph/BaseExplicitGraph.ts:136

## Extended by

- [`CallGraph`](CallGraph.md)
- [`Pag`](Pag.md)
- [`DVFG`](DVFG.md)

## Implements

- `GraphTraits`\<[`BaseNode`](BaseNode.md)\>

## Constructors

### Constructor

> **new BaseExplicitGraph**(): `BaseExplicitGraph`

Defined in: src/core/graph/BaseExplicitGraph.ts:142

#### Returns

`BaseExplicitGraph`

## Properties

### edgeMarkSet

> `protected` **edgeMarkSet**: `Set`\<`string`\>

Defined in: src/core/graph/BaseExplicitGraph.ts:140

***

### edgeNum

> `protected` **edgeNum**: `number` = `0`

Defined in: src/core/graph/BaseExplicitGraph.ts:137

***

### idToNodeMap

> `protected` **idToNodeMap**: `Map`\<`number`, [`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:139

***

### nodeNum

> `protected` **nodeNum**: `number` = `0`

Defined in: src/core/graph/BaseExplicitGraph.ts:138

## Methods

### addNode()

> **addNode**(`n`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:155

#### Parameters

##### n

[`BaseNode`](BaseNode.md)

#### Returns

`void`

***

### getGraphName()

> `abstract` **getGraphName**(): `string`

Defined in: src/core/graph/BaseExplicitGraph.ts:204

#### Returns

`string`

#### Implementation of

`GraphTraits.getGraphName`

***

### getNode()

> **getNode**(`id`): `undefined` \| [`BaseNode`](BaseNode.md)

Defined in: src/core/graph/BaseExplicitGraph.ts:160

#### Parameters

##### id

`number`

#### Returns

`undefined` \| [`BaseNode`](BaseNode.md)

#### Implementation of

`GraphTraits.getNode`

***

### getNodeNum()

> **getNodeNum**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:147

#### Returns

`number`

***

### getNodesIter()

> **getNodesIter**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:200

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

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

***

### hasNode()

> **hasNode**(`id`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:168

#### Parameters

##### id

`number`

#### Returns

`boolean`

***

### ifEdgeExisting()

> **ifEdgeExisting**(`edge`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:190

#### Parameters

##### edge

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

***

### nodesItor()

> **nodesItor**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:151

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

#### Implementation of

`GraphTraits.nodesItor`

***

### removeNode()

> **removeNode**(`id`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:172

#### Parameters

##### id

`number`

#### Returns

`boolean`
