[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / UndefinedVariableSolver

# Class: UndefinedVariableSolver

Defined in: src/core/dataflow/UndefinedVariable.ts:258

## Extends

- [`DataflowSolver`](DataflowSolver.md)\<[`Value`](../interfaces/Value.md)\>

## Constructors

### Constructor

> **new UndefinedVariableSolver**(`problem`, `scene`): `UndefinedVariableSolver`

Defined in: src/core/dataflow/UndefinedVariable.ts:259

#### Parameters

##### problem

[`UndefinedVariableChecker`](UndefinedVariableChecker.md)

##### scene

[`Scene`](Scene.md)

#### Returns

`UndefinedVariableSolver`

#### Overrides

[`DataflowSolver`](DataflowSolver.md).[`constructor`](DataflowSolver.md#constructor)

## Properties

### CHA

> `protected` **CHA**: [`ClassHierarchyAnalysis`](ClassHierarchyAnalysis.md)

Defined in: src/core/dataflow/DataflowSolver.ts:49

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`CHA`](DataflowSolver.md#cha)

***

### endSummary

> `protected` **endSummary**: `Map`\<[`PathEdgePoint`](PathEdgePoint.md)\<[`Value`](../interfaces/Value.md)\>, `Set`\<[`PathEdgePoint`](PathEdgePoint.md)\<[`Value`](../interfaces/Value.md)\>\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:46

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`endSummary`](DataflowSolver.md#endsummary)

***

### inComing

> `protected` **inComing**: `Map`\<[`PathEdgePoint`](PathEdgePoint.md)\<[`Value`](../interfaces/Value.md)\>, `Set`\<[`PathEdgePoint`](PathEdgePoint.md)\<[`Value`](../interfaces/Value.md)\>\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:45

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`inComing`](DataflowSolver.md#incoming)

***

### laterEdges

> `protected` **laterEdges**: `Set`\<[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:51

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`laterEdges`](DataflowSolver.md#lateredges)

***

### pathEdgeSet

> `protected` **pathEdgeSet**: `Set`\<[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:43

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`pathEdgeSet`](DataflowSolver.md#pathedgeset)

***

### problem

> `protected` **problem**: [`DataflowProblem`](DataflowProblem.md)\<[`Value`](../interfaces/Value.md)\>

Defined in: src/core/dataflow/DataflowSolver.ts:41

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`problem`](DataflowSolver.md#problem)

***

### scene

> `protected` **scene**: [`Scene`](Scene.md)

Defined in: src/core/dataflow/DataflowSolver.ts:48

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`scene`](DataflowSolver.md#scene)

***

### stmtNexts

> `protected` **stmtNexts**: `Map`\<[`Stmt`](Stmt.md), `Set`\<[`Stmt`](Stmt.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:50

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`stmtNexts`](DataflowSolver.md#stmtnexts)

***

### summaryEdge

> `protected` **summaryEdge**: `Set`\<`CallToReturnCacheEdge`\<[`Value`](../interfaces/Value.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:47

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`summaryEdge`](DataflowSolver.md#summaryedge)

***

### workList

> `protected` **workList**: [`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>[]

Defined in: src/core/dataflow/DataflowSolver.ts:42

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`workList`](DataflowSolver.md#worklist)

***

### zeroFact

> `protected` **zeroFact**: [`Value`](../interfaces/Value.md)

Defined in: src/core/dataflow/DataflowSolver.ts:44

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`zeroFact`](DataflowSolver.md#zerofact)

## Methods

### buildStmtMapInBlock()

> `protected` **buildStmtMapInBlock**(`block`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:113

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`buildStmtMapInBlock`](DataflowSolver.md#buildstmtmapinblock)

***

### buildStmtMapInClass()

> `protected` **buildStmtMapInClass**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:98

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`buildStmtMapInClass`](DataflowSolver.md#buildstmtmapinclass)

***

### callNodeFactPropagate()

> `protected` **callNodeFactPropagate**(`edge`, `firstStmt`, `fact`, `returnSite`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:288

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

##### firstStmt

[`Stmt`](Stmt.md)

##### fact

[`Value`](../interfaces/Value.md)

##### returnSite

[`Stmt`](Stmt.md)

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`callNodeFactPropagate`](DataflowSolver.md#callnodefactpropagate)

***

### computeResult()

> `protected` **computeResult**(`stmt`, `d`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:71

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### d

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`computeResult`](DataflowSolver.md#computeresult)

***

### doSolve()

> `protected` **doSolve**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:320

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`doSolve`](DataflowSolver.md#dosolve)

***

### getAllCalleeMethods()

> `protected` **getAllCalleeMethods**(`callNode`): `Set`\<[`ArkMethod`](ArkMethod.md)\>

Defined in: src/core/dataflow/DataflowSolver.ts:137

#### Parameters

##### callNode

[`ArkInvokeStmt`](ArkInvokeStmt.md)

#### Returns

`Set`\<[`ArkMethod`](ArkMethod.md)\>

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`getAllCalleeMethods`](DataflowSolver.md#getallcalleemethods)

***

### getChildren()

> `protected` **getChildren**(`stmt`): [`Stmt`](Stmt.md)[]

Defined in: src/core/dataflow/DataflowSolver.ts:80

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)[]

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`getChildren`](DataflowSolver.md#getchildren)

***

### getPathEdgeSet()

> **getPathEdgeSet**(): `Set`\<[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>\>

Defined in: src/core/dataflow/DataflowSolver.ts:355

#### Returns

`Set`\<[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>\>

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`getPathEdgeSet`](DataflowSolver.md#getpathedgeset)

***

### getReturnSiteOfCall()

> `protected` **getReturnSiteOfCall**(`call`): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/DataflowSolver.ts:152

#### Parameters

##### call

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`getReturnSiteOfCall`](DataflowSolver.md#getreturnsiteofcall)

***

### getStartOfCallerMethod()

> `protected` **getStartOfCallerMethod**(`call`): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/DataflowSolver.ts:156

#### Parameters

##### call

[`Stmt`](Stmt.md)

#### Returns

[`Stmt`](Stmt.md)

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`getStartOfCallerMethod`](DataflowSolver.md#getstartofcallermethod)

***

### init()

> `protected` **init**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:84

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`init`](DataflowSolver.md#init)

***

### isCallStatement()

> `protected` **isCallStatement**(`stmt`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:337

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`boolean`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`isCallStatement`](DataflowSolver.md#iscallstatement)

***

### isExitStatement()

> `protected` **isExitStatement**(`stmt`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:351

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`boolean`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`isExitStatement`](DataflowSolver.md#isexitstatement)

***

### pathEdgeSetHasEdge()

> `protected` **pathEdgeSetHasEdge**(`edge`): `boolean`

Defined in: src/core/dataflow/DataflowSolver.ts:162

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

#### Returns

`boolean`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`pathEdgeSetHasEdge`](DataflowSolver.md#pathedgesethasedge)

***

### processCallNode()

> `protected` **processCallNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:254

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`processCallNode`](DataflowSolver.md#processcallnode)

***

### processExitNode()

> `protected` **processExitNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:191

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`processExitNode`](DataflowSolver.md#processexitnode)

***

### processNormalNode()

> `protected` **processNormalNode**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:238

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`processNormalNode`](DataflowSolver.md#processnormalnode)

***

### propagate()

> `protected` **propagate**(`edge`): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:177

#### Parameters

##### edge

[`PathEdge`](PathEdge.md)\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`propagate`](DataflowSolver.md#propagate)

***

### setCfg4AllStmt()

> `protected` **setCfg4AllStmt**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:129

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`setCfg4AllStmt`](DataflowSolver.md#setcfg4allstmt)

***

### solve()

> **solve**(): `void`

Defined in: src/core/dataflow/DataflowSolver.ts:66

#### Returns

`void`

#### Inherited from

[`DataflowSolver`](DataflowSolver.md).[`solve`](DataflowSolver.md#solve)
