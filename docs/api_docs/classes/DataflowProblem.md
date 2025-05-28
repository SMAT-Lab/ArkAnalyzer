[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DataflowProblem

# Class: `abstract` DataflowProblem\<D\>

Defined in: src/core/dataflow/DataflowProblem.ts:19

## Extended by

- [`UndefinedVariableChecker`](UndefinedVariableChecker.md)

## Type Parameters

### D

`D`

## Constructors

### Constructor

> **new DataflowProblem**\<`D`\>(): `DataflowProblem`\<`D`\>

#### Returns

`DataflowProblem`\<`D`\>

## Methods

### createZeroValue()

> `abstract` **createZeroValue**(): `D`

Defined in: src/core/dataflow/DataflowProblem.ts:43

#### Returns

`D`

***

### factEqual()

> `abstract` **factEqual**(`d1`, `d2`): `boolean`

Defined in: src/core/dataflow/DataflowProblem.ts:49

#### Parameters

##### d1

`D`

##### d2

`D`

#### Returns

`boolean`

***

### getCallFlowFunction()

> `abstract` **getCallFlowFunction**(`srcStmt`, `method`): [`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

Defined in: src/core/dataflow/DataflowProblem.ts:37

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

***

### getCallToReturnFlowFunction()

> `abstract` **getCallToReturnFlowFunction**(`srcStmt`, `tgtStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

Defined in: src/core/dataflow/DataflowProblem.ts:41

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

***

### getEntryMethod()

> `abstract` **getEntryMethod**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/dataflow/DataflowProblem.ts:47

#### Returns

[`ArkMethod`](ArkMethod.md)

***

### getEntryPoint()

> `abstract` **getEntryPoint**(): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/DataflowProblem.ts:45

#### Returns

[`Stmt`](Stmt.md)

***

### getExitToReturnFlowFunction()

> `abstract` **getExitToReturnFlowFunction**(`srcStmt`, `tgtStmt`, `callStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

Defined in: src/core/dataflow/DataflowProblem.ts:39

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

##### callStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

***

### getNormalFlowFunction()

> `abstract` **getNormalFlowFunction**(`srcStmt`, `tgtStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>

Defined in: src/core/dataflow/DataflowProblem.ts:35

Transfer the outFact of srcStmt to the inFact of tgtStmt

Return true if keeping progagation (i.e., tgtStmt will be added to the WorkList for further analysis)

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<`D`\>
