[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PagNode

# Class: PagNode

Defined in: src/callgraph/pointerAnalysis/Pag.ts:141

## Extends

- [`BaseNode`](BaseNode.md)

## Extended by

- [`PagLocalNode`](PagLocalNode.md)
- [`PagInstanceFieldNode`](PagInstanceFieldNode.md)
- [`PagStaticFieldNode`](PagStaticFieldNode.md)
- [`PagThisRefNode`](PagThisRefNode.md)
- [`PagArrayNode`](PagArrayNode.md)
- [`PagNewExprNode`](PagNewExprNode.md)
- [`PagNewContainerExprNode`](PagNewContainerExprNode.md)
- [`PagParamNode`](PagParamNode.md)
- [`PagFuncNode`](PagFuncNode.md)
- [`PagGlobalThisNode`](PagGlobalThisNode.md)

## Constructors

### Constructor

> **new PagNode**(`id`, `cid`, `value`, `k`, `s?`): `PagNode`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:164

#### Parameters

##### id

`number`

##### cid

`undefined` | `number`

##### value

[`Value`](../interfaces/Value.md)

##### k

`number`

##### s?

[`Stmt`](Stmt.md)

#### Returns

`PagNode`

#### Overrides

[`BaseNode`](BaseNode.md).[`constructor`](BaseNode.md#constructor)

## Properties

### basePt

> `protected` **basePt**: `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:161

***

### clonedFrom

> `protected` **clonedFrom**: `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:162

***

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:68

#### Inherited from

[`BaseNode`](BaseNode.md).[`kind`](BaseNode.md#kind)

## Methods

### addAddressInEdge()

> **addAddressInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:232

#### Parameters

##### e

[`AddrPagEdge`](AddrPagEdge.md)

#### Returns

`void`

***

### addAddressOutEdge()

> **addAddressOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:238

#### Parameters

##### e

[`AddrPagEdge`](AddrPagEdge.md)

#### Returns

`void`

***

### addCopyInEdge()

> **addCopyInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:244

#### Parameters

##### e

[`CopyPagEdge`](CopyPagEdge.md)

#### Returns

`void`

***

### addCopyOutEdge()

> **addCopyOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:250

#### Parameters

##### e

[`CopyPagEdge`](CopyPagEdge.md)

#### Returns

`void`

***

### addIncomingEdge()

> **addIncomingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:105

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`addIncomingEdge`](BaseNode.md#addincomingedge)

***

### addLoadInEdge()

> **addLoadInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:257

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

***

### addLoadOutEdge()

> **addLoadOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:263

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

***

### addOutgoingEdge()

> **addOutgoingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:109

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`addOutgoingEdge`](BaseNode.md#addoutgoingedge)

***

### addPointToElement()

> **addPointToElement**(`node`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:301

#### Parameters

##### node

`number`

#### Returns

`void`

***

### addThisInEdge()

> **addThisInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:281

#### Parameters

##### e

[`ThisPagEdge`](ThisPagEdge.md)

#### Returns

`void`

***

### addThisOutEdge()

> **addThisOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:287

#### Parameters

##### e

[`ThisPagEdge`](ThisPagEdge.md)

#### Returns

`void`

***

### addWriteInEdge()

> **addWriteInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:269

#### Parameters

##### e

[`WritePagEdge`](WritePagEdge.md)

#### Returns

`void`

***

### addWriteOutEdge()

> **addWriteOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:275

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

***

### getBasePt()

> **getBasePt**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:173

#### Returns

`number`

***

### getCid()

> **getCid**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:181

#### Returns

`number`

***

### getClonedFrom()

> **getClonedFrom**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:323

#### Returns

`number`

***

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:331

#### Returns

`string`

#### Overrides

[`BaseNode`](BaseNode.md).[`getDotAttr`](BaseNode.md#getdotattr)

***

### getDotLabel()

> **getDotLabel**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:352

#### Returns

`string`

#### Overrides

[`BaseNode`](BaseNode.md).[`getDotLabel`](BaseNode.md#getdotlabel)

***

### getID()

> **getID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:77

#### Returns

`number`

#### Inherited from

[`BaseNode`](BaseNode.md).[`getID`](BaseNode.md#getid)

***

### getIncomingCopyEdges()

> **getIncomingCopyEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:208

#### Returns

`PagEdgeSet`

***

### getIncomingEdge()

> **getIncomingEdge**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:121

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`BaseNode`](BaseNode.md).[`getIncomingEdge`](BaseNode.md#getincomingedge)

***

### getIncomingThisEdges()

> **getIncomingThisEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:228

#### Returns

`PagEdgeSet`

***

### getIncomingWriteEdges()

> **getIncomingWriteEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:220

#### Returns

`PagEdgeSet`

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:81

#### Returns

`number`

#### Inherited from

[`BaseNode`](BaseNode.md).[`getKind`](BaseNode.md#getkind)

***

### getOutEdges()

> **getOutEdges**(): `object`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:309

#### Returns

`object`

##### AddressEdge

> **AddressEdge**: `PagEdgeSet`

##### CopyEdge

> **CopyEdge**: `PagEdgeSet`

##### LoadEdge

> **LoadEdge**: `PagEdgeSet`

##### WriteEdge

> **WriteEdge**: `PagEdgeSet`

***

### getOutgoingCopyEdges()

> **getOutgoingCopyEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:204

#### Returns

`PagEdgeSet`

***

### getOutgoingEdges()

> **getOutgoingEdges**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:125

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`BaseNode`](BaseNode.md).[`getOutgoingEdges`](BaseNode.md#getoutgoingedges)

***

### getOutgoingLoadEdges()

> **getOutgoingLoadEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:212

#### Returns

`PagEdgeSet`

***

### getOutgoingThisEdges()

> **getOutgoingThisEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:224

#### Returns

`PagEdgeSet`

***

### getOutgoingWriteEdges()

> **getOutgoingWriteEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:216

#### Returns

`PagEdgeSet`

***

### getPointTo()

> **getPointTo**(): `IPtsCollection`\<`number`\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:297

#### Returns

`IPtsCollection`\<`number`\>

***

### getStmt()

> **getStmt**(): `undefined` \| [`Stmt`](Stmt.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:196

#### Returns

`undefined` \| [`Stmt`](Stmt.md)

***

### getValue()

> **getValue**(): [`Value`](../interfaces/Value.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:293

#### Returns

[`Value`](../interfaces/Value.md)

***

### hasIncomingEdge()

> **hasIncomingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:97

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasIncomingEdge`](BaseNode.md#hasincomingedge)

***

### hasIncomingEdges()

> **hasIncomingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:89

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasIncomingEdges`](BaseNode.md#hasincomingedges)

***

### hasOutgoingCopyEdge()

> **hasOutgoingCopyEdge**(): `boolean`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:200

#### Returns

`boolean`

***

### hasOutgoingEdge()

> **hasOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:101

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasOutgoingEdge`](BaseNode.md#hasoutgoingedge)

***

### hasOutgoingEdges()

> **hasOutgoingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:93

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasOutgoingEdges`](BaseNode.md#hasoutgoingedges)

***

### removeIncomingEdge()

> **removeIncomingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:113

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`removeIncomingEdge`](BaseNode.md#removeincomingedge)

***

### removeOutgoingEdge()

> **removeOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:117

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`removeOutgoingEdge`](BaseNode.md#removeoutgoingedge)

***

### setBasePt()

> **setBasePt**(`pt`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:177

#### Parameters

##### pt

`number`

#### Returns

`void`

***

### setCid()

> **setCid**(`cid`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:188

#### Parameters

##### cid

`number`

#### Returns

`void`

***

### setClonedFrom()

> **setClonedFrom**(`id`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:327

#### Parameters

##### id

`number`

#### Returns

`void`

***

### setKind()

> **setKind**(`kind`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:85

#### Parameters

##### kind

`number`

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`setKind`](BaseNode.md#setkind)

***

### setPointTo()

> **setPointTo**(`pts`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:305

#### Parameters

##### pts

`IPtsCollection`\<`number`\>

#### Returns

`void`

***

### setStmt()

> **setStmt**(`s`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:192

#### Parameters

##### s

[`Stmt`](Stmt.md)

#### Returns

`void`
