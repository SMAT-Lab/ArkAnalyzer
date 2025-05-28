[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PagThisRefNode

# Class: PagThisRefNode

Defined in: src/callgraph/pointerAnalysis/Pag.ts:462

## Extends

- [`PagNode`](PagNode.md)

## Constructors

### Constructor

> **new PagThisRefNode**(`id`, `thisRef`): `PagThisRefNode`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:464

#### Parameters

##### id

`number`

##### thisRef

[`ArkThisRef`](ArkThisRef.md)

#### Returns

`PagThisRefNode`

#### Overrides

[`PagNode`](PagNode.md).[`constructor`](PagNode.md#constructor)

## Properties

### basePt

> `protected` **basePt**: `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:161

#### Inherited from

[`PagNode`](PagNode.md).[`basePt`](PagNode.md#basept)

***

### clonedFrom

> `protected` **clonedFrom**: `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:162

#### Inherited from

[`PagNode`](PagNode.md).[`clonedFrom`](PagNode.md#clonedfrom)

***

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:68

#### Inherited from

[`PagNode`](PagNode.md).[`kind`](PagNode.md#kind)

***

### pointToNode

> **pointToNode**: `number`[]

Defined in: src/callgraph/pointerAnalysis/Pag.ts:463

## Methods

### addAddressInEdge()

> **addAddressInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:232

#### Parameters

##### e

[`AddrPagEdge`](AddrPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addAddressInEdge`](PagNode.md#addaddressinedge)

***

### addAddressOutEdge()

> **addAddressOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:238

#### Parameters

##### e

[`AddrPagEdge`](AddrPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addAddressOutEdge`](PagNode.md#addaddressoutedge)

***

### addCopyInEdge()

> **addCopyInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:244

#### Parameters

##### e

[`CopyPagEdge`](CopyPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addCopyInEdge`](PagNode.md#addcopyinedge)

***

### addCopyOutEdge()

> **addCopyOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:250

#### Parameters

##### e

[`CopyPagEdge`](CopyPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addCopyOutEdge`](PagNode.md#addcopyoutedge)

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

[`PagNode`](PagNode.md).[`addIncomingEdge`](PagNode.md#addincomingedge)

***

### addLoadInEdge()

> **addLoadInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:257

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addLoadInEdge`](PagNode.md#addloadinedge)

***

### addLoadOutEdge()

> **addLoadOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:263

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addLoadOutEdge`](PagNode.md#addloadoutedge)

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

[`PagNode`](PagNode.md).[`addOutgoingEdge`](PagNode.md#addoutgoingedge)

***

### addPointToElement()

> **addPointToElement**(`node`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:301

#### Parameters

##### node

`number`

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addPointToElement`](PagNode.md#addpointtoelement)

***

### addPTNode()

> **addPTNode**(`ptNode`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:473

#### Parameters

##### ptNode

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

#### Inherited from

[`PagNode`](PagNode.md).[`addThisInEdge`](PagNode.md#addthisinedge)

***

### addThisOutEdge()

> **addThisOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:287

#### Parameters

##### e

[`ThisPagEdge`](ThisPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addThisOutEdge`](PagNode.md#addthisoutedge)

***

### addWriteInEdge()

> **addWriteInEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:269

#### Parameters

##### e

[`WritePagEdge`](WritePagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addWriteInEdge`](PagNode.md#addwriteinedge)

***

### addWriteOutEdge()

> **addWriteOutEdge**(`e`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:275

#### Parameters

##### e

[`LoadPagEdge`](LoadPagEdge.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`addWriteOutEdge`](PagNode.md#addwriteoutedge)

***

### getBasePt()

> **getBasePt**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:173

#### Returns

`number`

#### Inherited from

[`PagNode`](PagNode.md).[`getBasePt`](PagNode.md#getbasept)

***

### getCid()

> **getCid**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:181

#### Returns

`number`

#### Inherited from

[`PagNode`](PagNode.md).[`getCid`](PagNode.md#getcid)

***

### getClonedFrom()

> **getClonedFrom**(): `number`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:323

#### Returns

`number`

#### Inherited from

[`PagNode`](PagNode.md).[`getClonedFrom`](PagNode.md#getclonedfrom)

***

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:331

#### Returns

`string`

#### Inherited from

[`PagNode`](PagNode.md).[`getDotAttr`](PagNode.md#getdotattr)

***

### getDotLabel()

> **getDotLabel**(): `string`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:352

#### Returns

`string`

#### Inherited from

[`PagNode`](PagNode.md).[`getDotLabel`](PagNode.md#getdotlabel)

***

### getID()

> **getID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:77

#### Returns

`number`

#### Inherited from

[`PagNode`](PagNode.md).[`getID`](PagNode.md#getid)

***

### getIncomingCopyEdges()

> **getIncomingCopyEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:208

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getIncomingCopyEdges`](PagNode.md#getincomingcopyedges)

***

### getIncomingEdge()

> **getIncomingEdge**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:121

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`PagNode`](PagNode.md).[`getIncomingEdge`](PagNode.md#getincomingedge)

***

### getIncomingThisEdges()

> **getIncomingThisEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:228

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getIncomingThisEdges`](PagNode.md#getincomingthisedges)

***

### getIncomingWriteEdges()

> **getIncomingWriteEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:220

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getIncomingWriteEdges`](PagNode.md#getincomingwriteedges)

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:81

#### Returns

`number`

#### Inherited from

[`PagNode`](PagNode.md).[`getKind`](PagNode.md#getkind)

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

#### Inherited from

[`PagNode`](PagNode.md).[`getOutEdges`](PagNode.md#getoutedges)

***

### getOutgoingCopyEdges()

> **getOutgoingCopyEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:204

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getOutgoingCopyEdges`](PagNode.md#getoutgoingcopyedges)

***

### getOutgoingEdges()

> **getOutgoingEdges**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:125

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`PagNode`](PagNode.md).[`getOutgoingEdges`](PagNode.md#getoutgoingedges)

***

### getOutgoingLoadEdges()

> **getOutgoingLoadEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:212

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getOutgoingLoadEdges`](PagNode.md#getoutgoingloadedges)

***

### getOutgoingThisEdges()

> **getOutgoingThisEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:224

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getOutgoingThisEdges`](PagNode.md#getoutgoingthisedges)

***

### getOutgoingWriteEdges()

> **getOutgoingWriteEdges**(): `PagEdgeSet`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:216

#### Returns

`PagEdgeSet`

#### Inherited from

[`PagNode`](PagNode.md).[`getOutgoingWriteEdges`](PagNode.md#getoutgoingwriteedges)

***

### getPointTo()

> **getPointTo**(): `IPtsCollection`\<`number`\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:297

#### Returns

`IPtsCollection`\<`number`\>

#### Inherited from

[`PagNode`](PagNode.md).[`getPointTo`](PagNode.md#getpointto)

***

### getStmt()

> **getStmt**(): `undefined` \| [`Stmt`](Stmt.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:196

#### Returns

`undefined` \| [`Stmt`](Stmt.md)

#### Inherited from

[`PagNode`](PagNode.md).[`getStmt`](PagNode.md#getstmt)

***

### getThisPTNode()

> **getThisPTNode**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/Pag.ts:469

#### Returns

`number`[]

***

### getValue()

> **getValue**(): [`Value`](../interfaces/Value.md)

Defined in: src/callgraph/pointerAnalysis/Pag.ts:293

#### Returns

[`Value`](../interfaces/Value.md)

#### Inherited from

[`PagNode`](PagNode.md).[`getValue`](PagNode.md#getvalue)

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

[`PagNode`](PagNode.md).[`hasIncomingEdge`](PagNode.md#hasincomingedge)

***

### hasIncomingEdges()

> **hasIncomingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:89

#### Returns

`boolean`

#### Inherited from

[`PagNode`](PagNode.md).[`hasIncomingEdges`](PagNode.md#hasincomingedges)

***

### hasOutgoingCopyEdge()

> **hasOutgoingCopyEdge**(): `boolean`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:200

#### Returns

`boolean`

#### Inherited from

[`PagNode`](PagNode.md).[`hasOutgoingCopyEdge`](PagNode.md#hasoutgoingcopyedge)

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

[`PagNode`](PagNode.md).[`hasOutgoingEdge`](PagNode.md#hasoutgoingedge)

***

### hasOutgoingEdges()

> **hasOutgoingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:93

#### Returns

`boolean`

#### Inherited from

[`PagNode`](PagNode.md).[`hasOutgoingEdges`](PagNode.md#hasoutgoingedges)

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

[`PagNode`](PagNode.md).[`removeIncomingEdge`](PagNode.md#removeincomingedge)

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

[`PagNode`](PagNode.md).[`removeOutgoingEdge`](PagNode.md#removeoutgoingedge)

***

### setBasePt()

> **setBasePt**(`pt`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:177

#### Parameters

##### pt

`number`

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`setBasePt`](PagNode.md#setbasept)

***

### setCid()

> **setCid**(`cid`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:188

#### Parameters

##### cid

`number`

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`setCid`](PagNode.md#setcid)

***

### setClonedFrom()

> **setClonedFrom**(`id`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:327

#### Parameters

##### id

`number`

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`setClonedFrom`](PagNode.md#setclonedfrom)

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

[`PagNode`](PagNode.md).[`setKind`](PagNode.md#setkind)

***

### setPointTo()

> **setPointTo**(`pts`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:305

#### Parameters

##### pts

`IPtsCollection`\<`number`\>

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`setPointTo`](PagNode.md#setpointto)

***

### setStmt()

> **setStmt**(`s`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:192

#### Parameters

##### s

[`Stmt`](Stmt.md)

#### Returns

`void`

#### Inherited from

[`PagNode`](PagNode.md).[`setStmt`](PagNode.md#setstmt)
