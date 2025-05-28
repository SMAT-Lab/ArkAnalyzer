[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AbstractAnalysis

# Class: `abstract` AbstractAnalysis

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:31

## Extended by

- [`ClassHierarchyAnalysis`](ClassHierarchyAnalysis.md)
- [`RapidTypeAnalysis`](RapidTypeAnalysis.md)
- [`PointerAnalysis`](PointerAnalysis.md)

## Constructors

### Constructor

> **new AbstractAnalysis**(`s`, `cg`): `AbstractAnalysis`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:38

#### Parameters

##### s

[`Scene`](Scene.md)

##### cg

[`CallGraph`](CallGraph.md)

#### Returns

`AbstractAnalysis`

## Properties

### cg

> `protected` **cg**: [`CallGraph`](CallGraph.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:33

***

### cgBuilder

> `protected` **cgBuilder**: [`CallGraphBuilder`](CallGraphBuilder.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:34

***

### processedMethod

> `protected` **processedMethod**: `IPtsCollection`\<`number`\>

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:36

***

### scene

> `protected` **scene**: [`Scene`](Scene.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:32

***

### workList

> `protected` **workList**: `number`[] = `[]`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:35

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

***

### getCallGraph()

> **getCallGraph**(): [`CallGraph`](CallGraph.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:47

#### Returns

[`CallGraph`](CallGraph.md)

***

### getClassHierarchy()

> **getClassHierarchy**(`arkClass`): [`ArkClass`](ArkClass.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:62

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getParamAnonymousMethod()

> `protected` **getParamAnonymousMethod**(`invokeExpr`): [`MethodSignature`](MethodSignature.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:173

#### Parameters

##### invokeExpr

[`AbstractInvokeExpr`](AbstractInvokeExpr.md)

#### Returns

[`MethodSignature`](MethodSignature.md)[]

***

### getScene()

> **getScene**(): [`Scene`](Scene.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:43

#### Returns

[`Scene`](Scene.md)

***

### init()

> `protected` **init**(): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:140

#### Returns

`void`

***

### preProcessMethod()

> `abstract` `protected` **preProcessMethod**(`funcID`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:52

#### Parameters

##### funcID

`number`

#### Returns

[`CallSite`](CallSite.md)[]

***

### processMethod()

> `protected` **processMethod**(`methodID`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:147

#### Parameters

##### methodID

`number`

#### Returns

[`CallSite`](CallSite.md)[]

***

### projectStart()

> **projectStart**(`displayGeneratedMethod`): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:99

#### Parameters

##### displayGeneratedMethod

`boolean`

#### Returns

`void`

***

### resolveCall()

> `abstract` `protected` **resolveCall**(`sourceMethod`, `invokeStmt`): [`CallSite`](CallSite.md)[]

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:51

#### Parameters

##### sourceMethod

`number`

##### invokeStmt

[`Stmt`](Stmt.md)

#### Returns

[`CallSite`](CallSite.md)[]

***

### resolveInvokeExpr()

> **resolveInvokeExpr**(`invokeExpr`): `undefined` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:54

#### Parameters

##### invokeExpr

[`AbstractInvokeExpr`](AbstractInvokeExpr.md)

#### Returns

`undefined` \| [`ArkMethod`](ArkMethod.md)

***

### start()

> **start**(`displayGeneratedMethod`): `void`

Defined in: src/callgraph/algorithm/AbstractAnalysis.ts:78

#### Parameters

##### displayGeneratedMethod

`boolean`

#### Returns

`void`
