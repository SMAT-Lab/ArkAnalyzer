[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / FuncPag

# Class: FuncPag

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1053

## Constructors

### Constructor

> **new FuncPag**(): `FuncPag`

#### Returns

`FuncPag`

## Methods

### addDynamicCallSite()

> **addDynamicCallSite**(`cs`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1073

#### Parameters

##### cs

[`DynCallSite`](DynCallSite.md)

#### Returns

`void`

***

### addInternalEdge()

> **addInternalEdge**(`stmt`, `k`): `boolean`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1093

#### Parameters

##### stmt

[`ArkAssignStmt`](ArkAssignStmt.md)

##### k

[`PagEdgeKind`](../enumerations/PagEdgeKind.md)

#### Returns

`boolean`

***

### addNormalCallSite()

> **addNormalCallSite**(`cs`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1063

#### Parameters

##### cs

[`CallSite`](CallSite.md)

#### Returns

`void`

***

### addUnknownCallSite()

> **addUnknownCallSite**(`cs`): `void`

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1083

#### Parameters

##### cs

[`CallSite`](CallSite.md)

#### Returns

`void`

***

### getDynamicCallSites()

> **getDynamicCallSites**(): `Set`\<[`DynCallSite`](DynCallSite.md)\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1078

#### Returns

`Set`\<[`DynCallSite`](DynCallSite.md)\>

***

### getInternalEdges()

> **getInternalEdges**(): `undefined` \| `Set`\<[`IntraProceduralEdge`](../type-aliases/IntraProceduralEdge.md)\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1059

#### Returns

`undefined` \| `Set`\<[`IntraProceduralEdge`](../type-aliases/IntraProceduralEdge.md)\>

***

### getNormalCallSites()

> **getNormalCallSites**(): `Set`\<[`CallSite`](CallSite.md)\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1068

#### Returns

`Set`\<[`CallSite`](CallSite.md)\>

***

### getUnknownCallSites()

> **getUnknownCallSites**(): `Set`\<[`CallSite`](CallSite.md)\>

Defined in: src/callgraph/pointerAnalysis/Pag.ts:1088

#### Returns

`Set`\<[`CallSite`](CallSite.md)\>
