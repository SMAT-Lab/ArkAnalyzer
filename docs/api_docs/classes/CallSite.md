[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CallSite

# Class: CallSite

Defined in: src/callgraph/model/CallSite.ts:29

## Implements

- [`ICallSite`](../interfaces/ICallSite.md)

## Constructors

### Constructor

> **new CallSite**(`s`, `a`, `ce`, `cr`): `CallSite`

Defined in: src/callgraph/model/CallSite.ts:35

#### Parameters

##### s

[`Stmt`](Stmt.md)

##### a

`undefined` | [`Value`](../interfaces/Value.md)[]

##### ce

`number`

##### cr

`number`

#### Returns

`CallSite`

## Properties

### args

> **args**: `undefined` \| [`Value`](../interfaces/Value.md)[]

Defined in: src/callgraph/model/CallSite.ts:31

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`args`](../interfaces/ICallSite.md#args)

***

### calleeFuncID

> **calleeFuncID**: `number`

Defined in: src/callgraph/model/CallSite.ts:32

***

### callerFuncID

> **callerFuncID**: `number`

Defined in: src/callgraph/model/CallSite.ts:33

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`callerFuncID`](../interfaces/ICallSite.md#callerfuncid)

***

### callStmt

> **callStmt**: [`Stmt`](Stmt.md)

Defined in: src/callgraph/model/CallSite.ts:30

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`callStmt`](../interfaces/ICallSite.md#callstmt)
