[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CallGraphBuilder

# Class: CallGraphBuilder

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:24

## Constructors

### Constructor

> **new CallGraphBuilder**(`c`, `s`): `CallGraphBuilder`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:28

#### Parameters

##### c

[`CallGraph`](CallGraph.md)

##### s

[`Scene`](Scene.md)

#### Returns

`CallGraphBuilder`

## Methods

### buildCGNodes()

> **buildCGNodes**(`methods`): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:44

#### Parameters

##### methods

[`ArkMethod`](ArkMethod.md)[]

#### Returns

`void`

***

### buildCHA4WholeProject()

> **buildCHA4WholeProject**(`displayGeneratedMethod`): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:103

#### Parameters

##### displayGeneratedMethod

`boolean` = `false`

#### Returns

`void`

***

### buildClassHierarchyCallGraph()

> **buildClassHierarchyCallGraph**(`entries`, `displayGeneratedMethod`): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:92

#### Parameters

##### entries

[`MethodSignature`](MethodSignature.md)[]

##### displayGeneratedMethod

`boolean` = `false`

#### Returns

`void`

***

### buildDirectCallGraph()

> **buildDirectCallGraph**(`methods`): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:60

#### Parameters

##### methods

[`ArkMethod`](ArkMethod.md)[]

#### Returns

`void`

***

### buildDirectCallGraphForScene()

> **buildDirectCallGraphForScene**(): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:33

#### Returns

`void`

***

### buildRapidTypeCallGraph()

> **buildRapidTypeCallGraph**(`entries`, `displayGeneratedMethod`): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:108

#### Parameters

##### entries

[`MethodSignature`](MethodSignature.md)[]

##### displayGeneratedMethod

`boolean` = `false`

#### Returns

`void`

***

### setEntries()

> **setEntries**(): `void`

Defined in: src/callgraph/model/builder/CallGraphBuilder.ts:128

#### Returns

`void`
