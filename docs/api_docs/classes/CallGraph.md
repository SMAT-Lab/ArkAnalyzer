[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CallGraph

# Class: CallGraph

Defined in: src/callgraph/model/CallGraph.ts:122

## Extends

- [`BaseExplicitGraph`](BaseExplicitGraph.md)

## Constructors

### Constructor

> **new CallGraph**(`s`): `CallGraph`

Defined in: src/callgraph/model/CallGraph.ts:136

#### Parameters

##### s

[`Scene`](Scene.md)

#### Returns

`CallGraph`

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

### addCallGraphNode()

> **addCallGraphNode**(`method`, `kind`): [`CallGraphNode`](CallGraphNode.md)

Defined in: src/callgraph/model/CallGraph.ts:151

#### Parameters

##### method

[`MethodSignature`](MethodSignature.md)

##### kind

[`CallGraphNodeKind`](../enumerations/CallGraphNodeKind.md) = `CallGraphNodeKind.real`

#### Returns

[`CallGraphNode`](CallGraphNode.md)

***

### addDirectOrSpecialCallEdge()

> **addDirectOrSpecialCallEdge**(`caller`, `callee`, `callStmt`, `isDirectCall`): `void`

Defined in: src/callgraph/model/CallGraph.ts:188

#### Parameters

##### caller

[`MethodSignature`](MethodSignature.md)

##### callee

[`MethodSignature`](MethodSignature.md)

##### callStmt

[`Stmt`](Stmt.md)

##### isDirectCall

`boolean` = `true`

#### Returns

`void`

***

### addDynamicCallEdge()

> **addDynamicCallEdge**(`callerID`, `calleeID`, `callStmt`): `void`

Defined in: src/callgraph/model/CallGraph.ts:246

#### Parameters

##### callerID

`number`

##### calleeID

`number`

##### callStmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### addDynamicCallInfo()

> **addDynamicCallInfo**(`callStmt`, `caller`, `protentialCallee?`): `void`

Defined in: src/callgraph/model/CallGraph.ts:234

#### Parameters

##### callStmt

[`Stmt`](Stmt.md)

##### caller

[`MethodSignature`](MethodSignature.md)

##### protentialCallee?

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`

***

### addMethodToCallSiteMap()

> **addMethodToCallSiteMap**(`funcID`, `cs`): `void`

Defined in: src/callgraph/model/CallGraph.ts:278

#### Parameters

##### funcID

`number`

##### cs

[`CallSite`](CallSite.md)

#### Returns

`void`

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

### addStmtToCallSiteMap()

> **addStmtToCallSiteMap**(`stmt`, `cs`): `boolean`

Defined in: src/callgraph/model/CallGraph.ts:264

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### cs

[`CallSite`](CallSite.md)

#### Returns

`boolean`

***

### detectReachable()

> **detectReachable**(`fromID`, `dstID`): `boolean`

Defined in: src/callgraph/model/CallGraph.ts:359

#### Parameters

##### fromID

`number`

##### dstID

`number`

#### Returns

`boolean`

***

### dump()

> **dump**(`name`, `entry?`): `void`

Defined in: src/callgraph/model/CallGraph.ts:351

#### Parameters

##### name

`string`

##### entry?

`number`

#### Returns

`void`

***

### endStat()

> **endStat**(): `void`

Defined in: src/callgraph/model/CallGraph.ts:389

#### Returns

`void`

***

### getArkMethodByFuncID()

> **getArkMethodByFuncID**(`id`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/callgraph/model/CallGraph.ts:333

#### Parameters

##### id

`number`

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getCallEdgeByPair()

> **getCallEdgeByPair**(`srcID`, `dstID`): `undefined` \| [`CallGraphEdge`](CallGraphEdge.md)

Defined in: src/callgraph/model/CallGraph.ts:146

#### Parameters

##### srcID

`number`

##### dstID

`number`

#### Returns

`undefined` \| [`CallGraphEdge`](CallGraphEdge.md)

***

### getCallGraphNodeByMethod()

> **getCallGraphNodeByMethod**(`method`): [`CallGraphNode`](CallGraphNode.md)

Defined in: src/callgraph/model/CallGraph.ts:172

#### Parameters

##### method

[`MethodSignature`](MethodSignature.md)

#### Returns

[`CallGraphNode`](CallGraphNode.md)

***

### getCallSiteByStmt()

> **getCallSiteByStmt**(`stmt`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/model/CallGraph.ts:274

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

[`CallSite`](CallSite.md)[]

***

### getCallSitesByMethod()

> **getCallSitesByMethod**(`func`): `Set`\<[`CallSite`](CallSite.md)\>

Defined in: src/callgraph/model/CallGraph.ts:286

#### Parameters

##### func

`number` | [`MethodSignature`](MethodSignature.md)

#### Returns

`Set`\<[`CallSite`](CallSite.md)\>

***

### getDummyMainFuncID()

> **getDummyMainFuncID**(): `undefined` \| `number`

Defined in: src/callgraph/model/CallGraph.ts:405

#### Returns

`undefined` \| `number`

***

### getDynCallsiteByStmt()

> **getDynCallsiteByStmt**(`stmt`): `undefined` \| [`DynCallSite`](DynCallSite.md)

Defined in: src/callgraph/model/CallGraph.ts:260

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`undefined` \| [`DynCallSite`](DynCallSite.md)

***

### getDynEdges()

> **getDynEdges**(): `Map`\<[`MethodSignature`](MethodSignature.md), `Set`\<[`MethodSignature`](MethodSignature.md)\>\>

Defined in: src/callgraph/model/CallGraph.ts:307

#### Returns

`Map`\<[`MethodSignature`](MethodSignature.md), `Set`\<[`MethodSignature`](MethodSignature.md)\>\>

***

### getEntries()

> **getEntries**(): `number`[]

Defined in: src/callgraph/model/CallGraph.ts:343

#### Returns

`number`[]

***

### getGraphName()

> **getGraphName**(): `string`

Defined in: src/callgraph/model/CallGraph.ts:421

#### Returns

`string`

#### Overrides

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`getGraphName`](BaseExplicitGraph.md#getgraphname)

***

### getInvokeStmtByMethod()

> **getInvokeStmtByMethod**(`func`): [`Stmt`](Stmt.md)[]

Defined in: src/callgraph/model/CallGraph.ts:297

#### Parameters

##### func

`number` | [`MethodSignature`](MethodSignature.md)

#### Returns

[`Stmt`](Stmt.md)[]

***

### getMethodByFuncID()

> **getMethodByFuncID**(`id`): `null` \| [`MethodSignature`](MethodSignature.md)

Defined in: src/callgraph/model/CallGraph.ts:325

#### Parameters

##### id

`number`

#### Returns

`null` \| [`MethodSignature`](MethodSignature.md)

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

### getStat()

> **getStat**(): `string`

Defined in: src/callgraph/model/CallGraph.ts:397

#### Returns

`string`

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

### isUnknownMethod()

> **isUnknownMethod**(`funcID`): `boolean`

Defined in: src/callgraph/model/CallGraph.ts:409

#### Parameters

##### funcID

`number`

#### Returns

`boolean`

***

### nodesItor()

> **nodesItor**(): `IterableIterator`\<[`BaseNode`](BaseNode.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:151

#### Returns

`IterableIterator`\<[`BaseNode`](BaseNode.md)\>

#### Inherited from

[`BaseExplicitGraph`](BaseExplicitGraph.md).[`nodesItor`](BaseExplicitGraph.md#nodesitor)

***

### printStat()

> **printStat**(): `void`

Defined in: src/callgraph/model/CallGraph.ts:393

#### Returns

`void`

***

### removeCallGraphEdge()

> **removeCallGraphEdge**(`nodeID`): `void`

Defined in: src/callgraph/model/CallGraph.ts:222

#### Parameters

##### nodeID

`number`

#### Returns

`void`

***

### removeCallGraphNode()

> **removeCallGraphNode**(`nodeID`): `void`

Defined in: src/callgraph/model/CallGraph.ts:163

#### Parameters

##### nodeID

`number`

#### Returns

`void`

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

### setDummyMainFuncID()

> **setDummyMainFuncID**(`dummyMainMethodID`): `void`

Defined in: src/callgraph/model/CallGraph.ts:401

#### Parameters

##### dummyMainMethodID

`number`

#### Returns

`void`

***

### setEntries()

> **setEntries**(`n`): `void`

Defined in: src/callgraph/model/CallGraph.ts:347

#### Parameters

##### n

`number`[]

#### Returns

`void`

***

### startStat()

> **startStat**(): `void`

Defined in: src/callgraph/model/CallGraph.ts:385

#### Returns

`void`
