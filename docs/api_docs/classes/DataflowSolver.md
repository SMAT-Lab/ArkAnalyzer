[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DataflowSolver

# Class: `abstract` DataflowSolver\<D\>

Defined in: src/core/dataflow/DataflowSolver.ts:40

## Extended by

- [`UndefinedVariableSolver`](UndefinedVariableSolver.md)

## Type Parameters

### D

`D`

## Constructors

### Constructor

> **new DataflowSolver**\<`D`\>(`problem`, `scene`): `DataflowSolver`\<`D`\>

Defined in: src/core/dataflow/DataflowSolver.ts:53

#### Parameters

##### problem

[`DataflowProblem`](DataflowProblem.md)\<`D`\>

##### scene

[`Scene`](Scene.md)

#### Returns

`DataflowSolver`\<`D`\>

## Properties

### CHA

> `protected` **CHA**: [`ClassHierarchyAnalysis`](ClassHierarchyAnalysis.md)

Defined in: src/core/dataflow/DataflowSolver.ts:49

***

### endSummary

> `protected` **endSummary**: `Map`\<[`PathEdgePoint`](PathEdgePoint.md)\<`D`\>, `Set`\<[`PathEdgePoint`](PathEdgePoint.md)\<`D`\>\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:46

***

### inComing

> `protected` **inComing**: `Map`\<[`PathEdgePoint`](PathEdgePoint.md)\<`D`\>, `Set`\<[`PathEdgePoint`](PathEdgePoint.md)\<`D`\>\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:45

***

### laterEdges

> `protected` **laterEdges**: `Set`\<[`PathEdge`](PathEdge.md)\<`D`\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:51

***

### pathEdgeSet

> `protected` **pathEdgeSet**: `Set`\<[`PathEdge`](PathEdge.md)\<`D`\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:43

***

### problem

> `protected` **problem**: [`DataflowProblem`](DataflowProblem.md)\<`D`\>

Defined in: src/core/dataflow/DataflowSolver.ts:41

***

### scene

> `protected` **scene**: [`Scene`](Scene.md)

Defined in: src/core/dataflow/DataflowSolver.ts:48

***

### stmtNexts

> `protected` **stmtNexts**: `Map`\<[`Stmt`](Stmt.md), `Set`\<[`Stmt`](Stmt.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:50

***

### summaryEdge

> `protected` **summaryEdge**: `Set`\<`CallToReturnCacheEdge`\<`D`\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:47

***

### workList

> `protected` **workList**: [`PathEdge`](PathEdge.md)\<`D`\>[]

Defined in: src/core/dataflow/DataflowSolver.ts:42

***

### zeroFact

> `protected` **zeroFact**: `D`

Defined in: src/core/dataflow/DataflowSolver.ts:44

## Methods

### buildStmtMapInBlock()

> `protected` **buildStmtMapInBlock**(`block`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:113

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

#### Returns

`void`

***

### buildStmtMapInClass()

> `protected` **buildStmtMapInClass**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:98

#### Returns

`void`

***

### callNodeFactPropagate()

> `protected` **callNodeFactPropagate**(`edge`, `firstStmt`, `fact`, `returnSite`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:288

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

##### firstStmt

[`Stmt`](Stmt.md)

##### fact

`D`

##### returnSite

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### computeResult()

> `protected` **computeResult**(`stmt`, `d`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:71

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### d

`D`

#### Returns

`boolean`

***

### doSolve()

> `protected` **doSolve**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:320

#### Returns

`void`

***

### getAllCalleeMethods()

> `protected` **getAllCalleeMethods**(`callNode`): `Set`\<[`ArkMethod`](ArkMethod.md)\>

Defined in: src/core/dataflow/DataflowSolver.ts:137

#### Parameters

##### callNode

[`ArkInvokeStmt`](ArkInvokeStmt.md)

#### Returns

`Set`\<[`ArkMethod`](ArkMethod.md)\>

***

### getChildren()

> `protected` **getChildren**(`stmt`): [`Stmt`](Stmt.md)[]

Defined in: src/core/dataflow/DataflowSolver.ts:80

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)[]

***

### getPathEdgeSet()

> **getPathEdgeSet**(): `Set`\<[`PathEdge`](PathEdge.md)\<`D`\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:355

#### Returns

`Set`\<[`PathEdge`](PathEdge.md)\<`D`\>\>

***

### getReturnSiteOfCall()

> `protected` **getReturnSiteOfCall**(`call`): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/DataflowSolver.ts:152

#### Parameters

##### call

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)

***

### getStartOfCallerMethod()

> `protected` **getStartOfCallerMethod**(`call`): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/DataflowSolver.ts:156

#### Parameters

##### call

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)

***

### init()

> `protected` **init**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:84

#### Returns

`void`

***

### isCallStatement()

> `protected` **isCallStatement**(`stmt`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:337

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`boolean`

***

### isExitStatement()

> `protected` **isExitStatement**(`stmt`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:351

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`boolean`

***

### pathEdgeSetHasEdge()

> `protected` **pathEdgeSetHasEdge**(`edge`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:162

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

#### Returns

`boolean`

***

### processCallNode()

> `protected` **processCallNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:254

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

#### Returns

`void`

***

### processExitNode()

> `protected` **processExitNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:191

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

#### Returns

`void`

***

### processNormalNode()

> `protected` **processNormalNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:238

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

#### Returns

`void`

***

### propagate()

> `protected` **propagate**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:177

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<`D`\>

#### Returns

`void`

***

### setCfg4AllStmt()

> `protected` **setCfg4AllStmt**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:129

#### Returns

`void`

***

### solve()

> **solve**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:66

#### Returns

`void`
