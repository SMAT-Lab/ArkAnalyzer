[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DynCallSite

# Class: DynCallSite

Defined in: src/callgraph/model/CallSite.ts:43

## Implements

- [`ICallSite`](../interfaces/ICallSite.md)

## Constructors

### Constructor

> **new DynCallSite**(`s`, `a`, `ptcCallee`, `caller`): `DynCallSite`

Defined in: src/callgraph/model/CallSite.ts:49

#### Parameters

##### s

[`Stmt`](Stmt.md)

##### a

`undefined` | [`Value`](../interfaces/Value.md)[]

##### ptcCallee

`undefined` | `number`

##### caller

`number`

#### Returns

`DynCallSite`

## Properties

### args

> **args**: `undefined` \| [`Value`](../interfaces/Value.md)[]

Defined in: src/callgraph/model/CallSite.ts:45

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`args`](../interfaces/ICallSite.md#args)

***

### callerFuncID

> **callerFuncID**: `number`

Defined in: src/callgraph/model/CallSite.ts:47

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`callerFuncID`](../interfaces/ICallSite.md#callerfuncid)

***

### callStmt

> **callStmt**: [`Stmt`](Stmt.md)

Defined in: src/callgraph/model/CallSite.ts:44

#### Implementation of

[`ICallSite`](../interfaces/ICallSite.md).[`callStmt`](../interfaces/ICallSite.md#callstmt)

***

### protentialCalleeFuncID

> **protentialCalleeFuncID**: `undefined` \| `number`

Defined in: src/callgraph/model/CallSite.ts:46
