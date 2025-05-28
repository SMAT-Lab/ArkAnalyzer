[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PagBuilder

# Class: PagBuilder

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:74

## Constructors

### Constructor

> **new PagBuilder**(`p`, `cg`, `s`, `kLimit`, `scale`): `PagBuilder`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:104

#### Parameters

##### p

[`Pag`](Pag.md)

##### cg

[`CallGraph`](CallGraph.md)

##### s

[`Scene`](Scene.md)

##### kLimit

`number`

##### scale

`PtaAnalysisScale`

#### Returns

`PagBuilder`

## Methods

### addCallReturnPagEdge()

> **addCallReturnPagEdge**(`calleeMethod`, `callStmt`, `callerCid`, `calleeCid`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1073

process the return value PAG edge for invoke stmt

#### Parameters

##### calleeMethod

[`ArkMethod`](ArkMethod.md)

##### callStmt

[`Stmt`](Stmt.md)

##### callerCid

`number`

##### calleeCid

`number`

#### Returns

`number`[]

***

### addCallsEdgesFromFuncPag()

> **addCallsEdgesFromFuncPag**(`funcPag`, `cid`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:385

#### Parameters

##### funcPag

[`FuncPag`](FuncPag.md)

##### cid

`number`

#### Returns

`boolean`

***

### addDynamicCallEdge()

> **addDynamicCallEdge**(`cs`, `baseClassPTNode`, `cid`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:498

#### Parameters

##### cs

[`ICallSite`](../interfaces/ICallSite.md)

##### baseClassPTNode

`number`

##### cid

`number`

#### Returns

`number`[]

***

### addDynamicCallSite()

> **addDynamicCallSite**(`funcPag`, `funcID`, `cid`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:419

#### Parameters

##### funcPag

[`FuncPag`](FuncPag.md)

##### funcID

`number`

##### cid

`number`

#### Returns

`void`

***

### addEdgesFromFuncPag()

> **addEdgesFromFuncPag**(`funcPag`, `cid`, `funcID`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:348

#### Parameters

##### funcPag

[`FuncPag`](FuncPag.md)

##### cid

`number`

##### funcID

`number`

#### Returns

`boolean`

***

### addEdgesFromInterFuncPag()

> **addEdgesFromInterFuncPag**(`interFuncPag`, `cid`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1940

#### Parameters

##### interFuncPag

[`InterFuncPag`](InterFuncPag.md)

##### cid

`number`

#### Returns

`boolean`

***

### addPropertyLinkEdge()

> **addPropertyLinkEdge**(`propertyNode`, `storageObj`, `cid`, `stmt`, `edgeKind`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1332

add PagEdge

#### Parameters

##### propertyNode

[`PagNode`](PagNode.md)

##### storageObj

[`Value`](../interfaces/Value.md)

##### cid

`number`

##### stmt

[`Stmt`](Stmt.md)

##### edgeKind

`number`

#### Returns

`boolean`

***

### addStaticPagCallEdge()

> **addStaticPagCallEdge**(`cs`, `callerCid`, `calleeCid?`, `ptNode?`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:945

#### Parameters

##### cs

[`CallSite`](CallSite.md)

##### callerCid

`number`

##### calleeCid?

`number`

##### ptNode?

[`PagNode`](PagNode.md)

#### Returns

`number`[]

***

### addStaticPagCallReturnEdge()

> **addStaticPagCallReturnEdge**(`cs`, `callerCid`, `calleeCid`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1101

#### Parameters

##### cs

[`CallSite`](CallSite.md)

##### callerCid

`number`

##### calleeCid

`number`

#### Returns

`number`[]

***

### addToDynamicCallSite()

> **addToDynamicCallSite**(`funcPag`, `cs`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1744

#### Parameters

##### funcPag

[`FuncPag`](FuncPag.md)

##### cs

[`DynCallSite`](DynCallSite.md)

#### Returns

`void`

***

### addUnknownCallSite()

> **addUnknownCallSite**(`funcPag`, `funcID`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:466

#### Parameters

##### funcPag

[`FuncPag`](FuncPag.md)

##### funcID

`number`

#### Returns

`void`

***

### addUpdatedNode()

> **addUpdatedNode**(`nodeID`, `diffPT`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1968

#### Parameters

##### nodeID

`number`

##### diffPT

`IPtsCollection`\<`number`\>

#### Returns

`void`

***

### build()

> **build**(): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:164

#### Returns

`void`

***

### buildForEntries()

> **buildForEntries**(`funcIDs`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:136

#### Parameters

##### funcIDs

`number`[]

#### Returns

`void`

***

### buildFuncPag()

> **buildFuncPag**(`funcID`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:174

#### Parameters

##### funcID

`number`

#### Returns

`boolean`

***

### buildPagFromFuncPag()

> **buildPagFromFuncPag**(`funcID`, `cid`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:326

#### Parameters

##### funcID

`number`

##### cid

`number`

#### Returns

`void`

***

### doStat()

> **doStat**(): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1780

#### Returns

`void`

***

### getExportVariableMap()

> **getExportVariableMap**(`src`): [`Local`](Local.md)[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1935

#### Parameters

##### src

[`Local`](Local.md)

#### Returns

[`Local`](Local.md)[]

***

### getGlobalThisValue()

> **getGlobalThisValue**(): [`Local`](Local.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1496

#### Returns

[`Local`](Local.md)

***

### getHandledFuncs()

> **getHandledFuncs**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1800

#### Returns

`number`[]

***

### getOrNewGlobalThisNode()

> **getOrNewGlobalThisNode**(`cid`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1278

#### Parameters

##### cid

`number`

#### Returns

[`PagNode`](PagNode.md)

***

### getOrNewPagNode()

> **getOrNewPagNode**(`cid`, `v`, `s?`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1226

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

### getOrNewPropertyNode()

> **getOrNewPropertyNode**(`storage`, `propertyName`, `stmt`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1292

search the storage map to get propertyNode with given storage and propertyFieldName

#### Parameters

##### storage

[`StorageType`](../enumerations/StorageType.md)

storage type: AppStorage, LocalStorage etc.

##### propertyName

`string`

string property key

##### stmt

[`Stmt`](Stmt.md)

#### Returns

[`PagNode`](PagNode.md)

propertyNode: PagLocalNode

***

### getOrNewThisLoalNode()

> **getOrNewThisLoalNode**(`cid`, `v`, `s?`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1267

#### Parameters

##### cid

`number`

##### v

[`Local`](Local.md)

##### s?

[`Stmt`](Stmt.md)

#### Returns

[`PagNode`](PagNode.md)

***

### getOrNewThisRefNode()

> **getOrNewThisRefNode**(`cid`, `v`): [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1255

return ThisRef PAG node according to cid, a cid has a unique ThisRef node

#### Parameters

##### cid

`number`

##### v

[`ArkThisRef`](ArkThisRef.md)

#### Returns

[`PagNode`](PagNode.md)

***

### getPropertyNode()

> **getPropertyNode**(`storage`, `propertyName`, `stmt`): `undefined` \| [`PagNode`](PagNode.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1307

#### Parameters

##### storage

[`StorageType`](../enumerations/StorageType.md)

##### propertyName

`string`

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`undefined` \| [`PagNode`](PagNode.md)

***

### getRealInstanceRef()

> **getRealInstanceRef**(`v`): [`Value`](../interfaces/Value.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1361

#### Parameters

##### v

[`Value`](../interfaces/Value.md)

#### Returns

[`Value`](../interfaces/Value.md)

***

### getRealThisLocal()

> **getRealThisLocal**(`input`, `funcId`): [`Local`](Local.md)

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1759

#### Parameters

##### input

[`Local`](Local.md)

##### funcId

`number`

#### Returns

[`Local`](Local.md)

***

### getRetriggerNodes()

> **getRetriggerNodes**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1962

#### Returns

`number`[]

***

### getStat()

> **getStat**(): `string`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1788

#### Returns

`string`

***

### getUnhandledFuncs()

> **getUnhandledFuncs**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1792

#### Returns

`number`[]

***

### getUniqThisLocalNode()

> **getUniqThisLocalNode**(`cid`): `undefined` \| `number`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1282

#### Parameters

##### cid

`number`

#### Returns

`undefined` \| `number`

***

### getUpdatedNodes()

> **getUpdatedNodes**(): `Map`\<`number`, `IPtsCollection`\<`number`\>\>

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1975

#### Returns

`Map`\<`number`, `IPtsCollection`\<`number`\>\>

***

### handleReachable()

> **handleReachable**(): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:149

#### Returns

`boolean`

***

### handleUnkownDynamicCall()

> **handleUnkownDynamicCall**(`cs`, `cid`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:795

#### Parameters

##### cs

[`DynCallSite`](DynCallSite.md)

##### cid

`number`

#### Returns

`number`[]

***

### handleUnprocessedCallSites()

> **handleUnprocessedCallSites**(`processedCallSites`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:849

#### Parameters

##### processedCallSites

`Set`\<[`DynCallSite`](DynCallSite.md)\>

#### Returns

`number`[]

***

### isSingletonFunction()

> **isSingletonFunction**(`funcID`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1399

check if a method is singleton function
rule: static method, assign heap obj to global var or static field, return the receiver

#### Parameters

##### funcID

`number`

#### Returns

`boolean`

***

### printStat()

> **printStat**(): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1784

#### Returns

`void`

***

### processBuiltInMethodPagCallEdge()

> **processBuiltInMethodPagCallEdge**(`staticCS`, `cid`, `calleeCid`, `baseClassPTNode`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:641

include container API, Function API

#### Parameters

##### staticCS

[`CallSite`](CallSite.md)

##### cid

`number`

##### calleeCid

`number`

##### baseClassPTNode

`number`

#### Returns

`number`[]

***

### processNormalMethodPagCallEdge()

> **processNormalMethodPagCallEdge**(`staticCS`, `cid`, `calleeCid`, `baseClassPTNode`): `number`[]

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:605

#### Parameters

##### staticCS

[`CallSite`](CallSite.md)

##### cid

`number`

##### calleeCid

`number`

##### baseClassPTNode

`number`

#### Returns

`number`[]

***

### resetUpdatedNodes()

> **resetUpdatedNodes**(): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1979

#### Returns

`void`

***

### setPtForNode()

> **setPtForNode**(`node`, `pts`): `void`

Defined in: src/callgraph/pointerAnalysis/PagBuilder.ts:1751

#### Parameters

##### node

`number`

##### pts

`undefined` | `IPtsCollection`\<`number`\>

#### Returns

`void`
