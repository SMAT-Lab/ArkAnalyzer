[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / RapidTypeAnalysis

# Class: RapidTypeAnalysis

Defined in: src/callgraph/algorithm/RapidTypeAnalysis.ts:29

## Extends

- [`AbstractAnalysis`](AbstractAnalysis.md)

## Constructors

### Constructor

> **new RapidTypeAnalysis**(`scene`, `cg`): `RapidTypeAnalysis`

Defined in: src/callgraph/algorithm/RapidTypeAnalysis.ts:35

#### Parameters

##### scene

[`Scene`](Scene.md)

##### cg

[`CallGraph`](CallGraph.md)

#### Returns

`RapidTypeAnalysis`

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

### addIgnoredCalls()

> **addIgnoredCalls**(`arkClass`, `callerID`, `calleeID`, `invokeStmt`): `void`

Defined in: src/callgraph/algorithm/RapidTypeAnalysis.ts:148

#### Parameters

##### arkClass

[`ClassSignature`](ClassSignature.md)

##### callerID

`number`

##### calleeID

`number`

##### invokeStmt

[`Stmt`](Stmt.md)

#### Returns

`void`

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

### getScene()

> **getScene**(): [`Scene`](Scene.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:43

#### Returns

[`Scene`](Scene.md)

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`getScene`](AbstractAnalysis.md#getscene)

***

### init()

> `protected` **init**(): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:140

#### Returns

`void`

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`init`](AbstractAnalysis.md#init)

***

### preProcessMethod()

> `protected` **preProcessMethod**(`funcID`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/RapidTypeAnalysis.ts:101

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

> **resolveCall**(`callerMethod`, `invokeStmt`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/RapidTypeAnalysis.ts:39

#### Parameters

##### callerMethod

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

### start()

> **start**(`displayGeneratedMethod`): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:78

#### Parameters

##### displayGeneratedMethod

`boolean`

#### Returns

`void`

#### Inherited from

[`AbstractAnalysis`](AbstractAnalysis.md).[`start`](AbstractAnalysis.md#start)
