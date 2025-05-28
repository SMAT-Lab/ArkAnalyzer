[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Pag

# Class: Pag

Defined in: src/callgraph/pointerAnalysis/Pag.ts:650

## Extends

- [`BaseExplicitGraph`](BaseExplicitGraph.md)

## Constructors

### Constructor

> **new Pag**(): `Pag`

Defined in: src/core/graph/BaseExplicitGraph.ts:142

#### Returns

`Pag`

#### Inherited from

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

### addPagEdge()

> **addPagEdge**(`src`, `dst`, `kind`, `stmt?`): `boolean`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:982

#### Parameters

##### src

[`PagNode`](PagNode.md)

##### dst

[`PagNode`](PagNode.md)

##### kind

[`PagEdgeKind`](../enumerations/PagEdgeKind.md)

##### stmt?

[`Stmt`](Stmt.md)

#### Returns

`boolean`

***

### addPagNode()

> **addPagNode**(`cid`, `value`, `stmt?`, `refresh?`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:764

#### Parameters

##### cid

`number`

##### value

[`Value`](../interfaces/Value.md)

##### stmt?

[`Stmt`](Stmt.md)

##### refresh?

`boolean` = `true`

#### Returns

[`PagNode`](PagNode.md)

***

### addPagThisLocalNode()

> **addPagThisLocalNode**(`ptNode`, `value`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:900

#### Parameters

##### ptNode

`number`

##### value

[`Local`](Local.md)

#### Returns

[`PagNode`](PagNode.md)

***

### addPagThisRefNode()

> **addPagThisRefNode**(`value`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:892

#### Parameters

##### value

[`ArkThisRef`](ArkThisRef.md)

#### Returns

[`PagNode`](PagNode.md)

***

### dump()

> **dump**(`name`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1034

#### Parameters

##### name

`string`

#### Returns

`void`

***

### getAddrEdges()

> **getAddrEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1022

#### Returns

`PagEdgeSet`

***

### getCG()

> **getCG**(): [`CallGraph`](CallGraph.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:662

#### Returns

[`CallGraph`](CallGraph.md)

***

### getGraphName()

> **getGraphName**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1030

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

### getNodesByBaseValue()

> **getNodesByBaseValue**(`v`): `undefined` \| `Map`\<`number`, `number`[]\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:978

#### Parameters

##### v

[`Value`](../interfaces/Value.md)

#### Returns

`undefined` \| `Map`\<`number`, `number`[]\>

***

### getNodesByValue()

> **getNodesByValue**(`v`): `undefined` \| `Map`\<`number`, `number`\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:974

#### Parameters

##### v

[`Value`](../interfaces/Value.md)

#### Returns

`undefined` \| `Map`\<`number`, `number`\>

***

### getNodesIter()

> **getNodesIter**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:200

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getNodesIter`](BaseExplicitGraph.md#getnodesiter)

***

### getOrClonePagContainerFieldNode()

> **getOrClonePagContainerFieldNode**(`basePt`, `src?`, `base?`): `undefined` \| [`PagInstanceFieldNode`](PagInstanceFieldNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:712

#### Parameters

##### basePt

`number`

##### src?

[`PagArrayNode`](PagArrayNode.md)

##### base?

[`Local`](Local.md)

#### Returns

`undefined` \| [`PagInstanceFieldNode`](PagInstanceFieldNode.md)

***

### getOrClonePagFieldNode()

> **getOrClonePagFieldNode**(`src`, `basePt`): `undefined` \| [`PagInstanceFieldNode`](PagInstanceFieldNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:693

#### Parameters

##### src

[`PagInstanceFieldNode`](PagInstanceFieldNode.md)

##### basePt

`number`

#### Returns

`undefined` \| [`PagInstanceFieldNode`](PagInstanceFieldNode.md)

***

### getOrClonePagFuncNode()

> **getOrClonePagFuncNode**(`basePt`): `undefined` \| [`PagFuncNode`](PagFuncNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:753

#### Parameters

##### basePt

`number`

#### Returns

`undefined` \| [`PagFuncNode`](PagFuncNode.md)

***

### getOrClonePagNode()

> **getOrClonePagNode**(`src`, `basePt`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:670

#### Parameters

##### src

[`PagNode`](PagNode.md)

##### basePt

`number`

#### Returns

[`PagNode`](PagNode.md)

***

### getOrNewNode()

> **getOrNewNode**(`cid`, `v`, `s?`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:957

#### Parameters

##### cid

`number`

##### v

[`Value`](../interfaces/Value.md)

##### s?

[`Stmt`](Stmt.md)

#### Returns

[`PagNode`](PagNode.md)

***

### getOrNewThisLocalNode()

> **getOrNewThisLocalNode**(`cid`, `ptNode`, `value`, `s?`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:917

#### Parameters

##### cid

`number`

##### ptNode

`number`

##### value

[`Local`](Local.md)

##### s?

[`Stmt`](Stmt.md)

#### Returns

[`PagNode`](PagNode.md)

***

### getOrNewThisRefNode()

> **getOrNewThisRefNode**(`thisRefNodeID`, `value`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:908

#### Parameters

##### thisRefNodeID

`number`

##### value

[`ArkThisRef`](ArkThisRef.md)

#### Returns

[`PagNode`](PagNode.md)

***

### hasCtxNode()

> **hasCtxNode**(`cid`, `v`): `undefined` \| `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:930

#### Parameters

##### cid

`number`

##### v

[`Value`](../interfaces/Value.md)

#### Returns

`undefined` \| `number`

***

### hasCtxRetNode()

> **hasCtxRetNode**(`cid`, `v`): `undefined` \| `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:944

#### Parameters

##### cid

`number`

##### v

[`Value`](../interfaces/Value.md)

#### Returns

`undefined` \| `number`

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

### hasExportNode()

> **hasExportNode**(`v`): `undefined` \| `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:925

#### Parameters

##### v

[`ExportInfo`](ExportInfo.md)

#### Returns

`undefined` \| `number`

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

***

### resetAddrEdges()

> **resetAddrEdges**(): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1026

#### Returns

`void`
