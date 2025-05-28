[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PointerAnalysis

# Class: PointerAnalysis

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:38

## Extends

- [`AbstractAnalysis`](AbstractAnalysis.md)

## Constructors

### Constructor

> **new PointerAnalysis**(`p`, `cg`, `s`, `config`): `PointerAnalysis`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:49

#### Parameters

##### p

[`Pag`](Pag.md)

##### cg

[`CallGraph`](CallGraph.md)

##### s

[`Scene`](Scene.md)

##### config

[`PointerAnalysisConfig`](PointerAnalysisConfig.md)

#### Returns

`PointerAnalysis`

#### Overrides

[`AbstractAnalysis`](AbstractAnalysis.md).[`constructor`](AbstractAnalysis.md#constructor)

## Properties

### cg

> `protected` **cg**: [`CallGraph`](CallGraph.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:33

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`cg`](AbstractAnalysis.md#cg)

***

### cgBuilder

> `protected` **cgBuilder**: [`CallGraphBuilder`](CallGraphBuilder.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:34

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`cgBuilder`](AbstractAnalysis.md#cgbuilder)

***

### processedMethod

> `protected` **processedMethod**: `IPtsCollection`\<`number`\>

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:36

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`processedMethod`](AbstractAnalysis.md#processedmethod)

***

### scene

> `protected` **scene**: [`Scene`](Scene.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:32

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`scene`](AbstractAnalysis.md#scene)

***

### workList

> `protected` **workList**: `number`[] = `[]`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:35

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`workList`](AbstractAnalysis.md#worklist)

## Methods

### addCallGraphEdge()

> `protected` **addCallGraphEdge**(`caller`, `callee`, `cs`, `displayGeneratedMethod`): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:186

#### Parameters

##### caller

`number`

##### callee

`null` | [`ArkMethod`](ArkMethod.md)

##### cs

[`CallSite`](CallSite.md)

##### displayGeneratedMethod

`boolean`

#### Returns

`void`

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`addCallGraphEdge`](AbstractAnalysis.md#addcallgraphedge)

***

### getCallGraph()

> **getCallGraph**(): [`CallGraph`](CallGraph.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:47

#### Returns

[`CallGraph`](CallGraph.md)

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`getCallGraph`](AbstractAnalysis.md#getcallgraph)

***

### getClassHierarchy()

> **getClassHierarchy**(`arkClass`): [`ArkClass`](ArkClass.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:62

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

[`ArkClass`](ArkClass.md)[]

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`getClassHierarchy`](AbstractAnalysis.md#getclasshierarchy)

***

### getHandledFuncs()

> **getHandledFuncs**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:624

#### Returns

`number`[]

***

### getParamAnonymousMethod()

> `protected` **getParamAnonymousMethod**(`invokeExpr`): [`MethodSignature`](MethodSignature.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:173

#### Parameters

##### invokeExpr

[`AbstractInvokeExpr`](AbstractInvokeExpr.md)

#### Returns

[`MethodSignature`](MethodSignature.md)[]

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`getParamAnonymousMethod`](AbstractAnalysis.md#getparamanonymousmethod)

***

### getPTAConfig()

> **getPTAConfig**(): [`PointerAnalysisConfig`](PointerAnalysisConfig.md)

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:628

#### Returns

[`PointerAnalysisConfig`](PointerAnalysisConfig.md)

***

### getPTD()

> **getPTD**(): [`DiffPTData`](DiffPTData.md)\<`number`, `number`, `IPtsCollection`\<`number`\>\>

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:132

#### Returns

[`DiffPTData`](DiffPTData.md)\<`number`, `number`, `IPtsCollection`\<`number`\>\>

***

### getRelatedNodes()

> **getRelatedNodes**(`value`): `Set`\<[`Value`](../interfaces/Value.md)\>

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:503

#### Parameters

##### value

[`Value`](../interfaces/Value.md)

#### Returns

`Set`\<[`Value`](../interfaces/Value.md)\>

***

### getScene()

> **getScene**(): [`Scene`](Scene.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:43

#### Returns

[`Scene`](Scene.md)

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`getScene`](AbstractAnalysis.md#getscene)

***

### getStat()

> **getStat**(): `string`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:136

#### Returns

`string`

***

### getTypeDiffMap()

> **getTypeDiffMap**(): `Map`\<[`Value`](../interfaces/Value.md), `Set`\<[`Type`](Type.md)\>\>

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:612

#### Returns

`Map`\<[`Value`](../interfaces/Value.md), `Set`\<[`Type`](Type.md)\>\>

***

### getUnhandledFuncs()

> **getUnhandledFuncs**(): `number`[]

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:620

#### Returns

`number`[]

***

### init()

> `protected` **init**(): `void`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:98

#### Returns

`void`

#### Overrides

[`AbstractAnalysis`](AbstractAnalysis.md).[`init`](AbstractAnalysis.md#init)

***

### mayAlias()

> **mayAlias**(`leftValue`, `rightValue`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:499

#### Parameters

##### leftValue

[`Value`](../interfaces/Value.md)

##### rightValue

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

***

### mergeInstanceFieldMap()

> **mergeInstanceFieldMap**(`src`, `dst`): `Map`\<`number`, `number`[]\>

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:662

#### Parameters

##### src

`Map`\<`number`, `number`[]\>

##### dst

`Map`\<`number`, `number`[]\>

#### Returns

`Map`\<`number`, `number`[]\>

***

### noAlias()

> **noAlias**(`leftValue`, `rightValue`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:464

compare interface

#### Parameters

##### leftValue

[`Value`](../interfaces/Value.md)

##### rightValue

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

***

### preProcessMethod()

> `protected` **preProcessMethod**(`funcID`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:144

#### Parameters

##### funcID

`number`

#### Returns

[`CallSite`](CallSite.md)[]

#### Overrides

[`AbstractAnalysis`](AbstractAnalysis.md).[`preProcessMethod`](AbstractAnalysis.md#preprocessmethod)

***

### processMethod()

> `protected` **processMethod**(`methodID`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:147

#### Parameters

##### methodID

`number`

#### Returns

[`CallSite`](CallSite.md)[]

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`processMethod`](AbstractAnalysis.md#processmethod)

***

### projectStart()

> **projectStart**(`displayGeneratedMethod`): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:99

#### Parameters

##### displayGeneratedMethod

`boolean`

#### Returns

`void`

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`projectStart`](AbstractAnalysis.md#projectstart)

***

### resolveCall()

> `protected` **resolveCall**(`sourceMethod`, `invokeStmt`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:616

#### Parameters

##### sourceMethod

`number`

##### invokeStmt

[`Stmt`](Stmt.md)

#### Returns

[`CallSite`](CallSite.md)[]

#### Overrides

[`AbstractAnalysis`](AbstractAnalysis.md).[`resolveCall`](AbstractAnalysis.md#resolvecall)

***

### resolveInvokeExpr()

> **resolveInvokeExpr**(`invokeExpr`): `undefined` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:54

#### Parameters

##### invokeExpr

[`AbstractInvokeExpr`](AbstractInvokeExpr.md)

#### Returns

`undefined` \| [`ArkMethod`](ArkMethod.md)

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`resolveInvokeExpr`](AbstractAnalysis.md#resolveinvokeexpr)

***

### setEntries()

> **setEntries**(`fIds`): `void`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:149

#### Parameters

##### fIds

`number`[]

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:110

#### Returns

`void`

#### Overrides

[`AbstractAnalysis`](AbstractAnalysis.md).[`start`](AbstractAnalysis.md#start)

***

### pointerAnalysisForMethod()

> `static` **pointerAnalysisForMethod**(`s`, `method`, `config?`): `PointerAnalysis`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:82

#### Parameters

##### s

[`Scene`](Scene.md)

##### method

[`ArkMethod`](ArkMethod.md)

##### config?

[`PointerAnalysisConfig`](PointerAnalysisConfig.md)

#### Returns

`PointerAnalysis`

***

### pointerAnalysisForWholeProject()

> `static` **pointerAnalysisForWholeProject**(`projectScene`, `config?`): `PointerAnalysis`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysis.ts:59

#### Parameters

##### projectScene

[`Scene`](Scene.md)

##### config?

[`PointerAnalysisConfig`](PointerAnalysisConfig.md)

#### Returns

`PointerAnalysis`
