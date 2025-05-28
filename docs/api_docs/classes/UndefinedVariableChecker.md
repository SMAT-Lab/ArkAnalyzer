[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / UndefinedVariableChecker

# Class: UndefinedVariableChecker

Defined in: src/core/dataflow/UndefinedVariable.ts:36

## Extends

- [`DataflowProblem`](DataflowProblem.md)\<[`Value`](../interfaces/Value.md)\>

## Constructors

### Constructor

> **new UndefinedVariableChecker**(`stmt`, `method`): `UndefinedVariableChecker`

Defined in: src/core/dataflow/UndefinedVariable.ts:44

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`UndefinedVariableChecker`

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`constructor`](DataflowProblem.md#constructor)

## Properties

### classMap

> **classMap**: `Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`ArkClass`](ArkClass.md)[]\>

Defined in: src/core/dataflow/UndefinedVariable.ts:41

***

### entryMethod

> **entryMethod**: [`ArkMethod`](ArkMethod.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:39

***

### entryPoint

> **entryPoint**: [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:38

***

### globalVariableMap

> **globalVariableMap**: `Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`Local`](Local.md)[]\>

Defined in: src/core/dataflow/UndefinedVariable.ts:42

***

### outcomes

> **outcomes**: `Outcome`[] = `[]`

Defined in: src/core/dataflow/UndefinedVariable.ts:43

***

### scene

> **scene**: [`Scene`](Scene.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:40

***

### zeroValue

> **zeroValue**: [`Constant`](Constant.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:37

## Methods

### addParameters()

> **addParameters**(`srcStmt`, `dataFact`, `method`, `ret`): `void`

Defined in: src/core/dataflow/UndefinedVariable.ts:185

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### dataFact

[`Value`](../interfaces/Value.md)

##### method

[`ArkMethod`](ArkMethod.md)

##### ret

`Set`\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

***

### addUndefinedField()

> **addUndefinedField**(`field`, `method`, `ret`): `void`

Defined in: src/core/dataflow/UndefinedVariable.ts:170

#### Parameters

##### field

[`ArkField`](ArkField.md)

##### method

[`ArkMethod`](ArkMethod.md)

##### ret

`Set`\<[`Value`](../interfaces/Value.md)\>

#### Returns

`void`

***

### createZeroValue()

> **createZeroValue**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:234

#### Returns

[`Value`](../interfaces/Value.md)

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`createZeroValue`](DataflowProblem.md#createzerovalue)

***

### factEqual()

> **factEqual**(`d1`, `d2`): `boolean`

Defined in: src/core/dataflow/UndefinedVariable.ts:242

#### Parameters

##### d1

[`Value`](../interfaces/Value.md)

##### d2

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`factEqual`](DataflowProblem.md#factequal)

***

### getCallFlowFunction()

> **getCallFlowFunction**(`srcStmt`, `method`): [`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

Defined in: src/core/dataflow/UndefinedVariable.ts:117

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getCallFlowFunction`](DataflowProblem.md#getcallflowfunction)

***

### getCallToReturnFlowFunction()

> **getCallToReturnFlowFunction**(`srcStmt`, `tgtStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

Defined in: src/core/dataflow/UndefinedVariable.ts:217

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getCallToReturnFlowFunction`](DataflowProblem.md#getcalltoreturnflowfunction)

***

### getEntryMethod()

> **getEntryMethod**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:57

#### Returns

[`ArkMethod`](ArkMethod.md)

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getEntryMethod`](DataflowProblem.md#getentrymethod)

***

### getEntryPoint()

> **getEntryPoint**(): [`Stmt`](Stmt.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:53

#### Returns

[`Stmt`](Stmt.md)

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getEntryPoint`](DataflowProblem.md#getentrypoint)

***

### getExitToReturnFlowFunction()

> **getExitToReturnFlowFunction**(`srcStmt`, `tgtStmt`, `callStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

Defined in: src/core/dataflow/UndefinedVariable.ts:204

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

##### callStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getExitToReturnFlowFunction`](DataflowProblem.md#getexittoreturnflowfunction)

***

### getNormalFlowFunction()

> **getNormalFlowFunction**(`srcStmt`, `tgtStmt`): [`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

Defined in: src/core/dataflow/UndefinedVariable.ts:71

Transfer the outFact of srcStmt to the inFact of tgtStmt

Return true if keeping progagation (i.e., tgtStmt will be added to the WorkList for further analysis)

#### Parameters

##### srcStmt

[`Stmt`](Stmt.md)

##### tgtStmt

[`Stmt`](Stmt.md)

#### Returns

[`FlowFunction`](../interfaces/FlowFunction.md)\<[`Value`](../interfaces/Value.md)\>

#### Overrides

[`DataflowProblem`](DataflowProblem.md).[`getNormalFlowFunction`](DataflowProblem.md#getnormalflowfunction)

***

### getOutcomes()

> **getOutcomes**(): `Outcome`[]

Defined in: src/core/dataflow/UndefinedVariable.ts:253

#### Returns

`Outcome`[]

***

### getZeroValue()

> **getZeroValue**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/dataflow/UndefinedVariable.ts:238

#### Returns

[`Value`](../interfaces/Value.md)

***

### insideCallFlowFunction()

> **insideCallFlowFunction**(`ret`, `method`): `void`

Defined in: src/core/dataflow/UndefinedVariable.ts:151

#### Parameters

##### ret

`Set`\<[`Value`](../interfaces/Value.md)\>

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### insideNormalFlowFunction()

> **insideNormalFlowFunction**(`ret`, `srcStmt`, `dataFact`): `void`

Defined in: src/core/dataflow/UndefinedVariable.ts:88

#### Parameters

##### ret

`Set`\<[`Value`](../interfaces/Value.md)\>

##### srcStmt

[`ArkAssignStmt`](ArkAssignStmt.md)

##### dataFact

[`Value`](../interfaces/Value.md)

#### Returns

`void`
