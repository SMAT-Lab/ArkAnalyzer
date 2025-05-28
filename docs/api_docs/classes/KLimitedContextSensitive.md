[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / KLimitedContextSensitive

# Class: KLimitedContextSensitive

Defined in: src/callgraph/pointerAnalysis/Context.ts:131

## Constructors

### Constructor

> **new KLimitedContextSensitive**(`k`): `KLimitedContextSensitive`

Defined in: src/callgraph/pointerAnalysis/Context.ts:135

#### Parameters

##### k

`number`

#### Returns

`KLimitedContextSensitive`

## Properties

### ctxCache

> **ctxCache**: `ContextCache`

Defined in: src/callgraph/pointerAnalysis/Context.ts:133

***

### k

> **k**: `number`

Defined in: src/callgraph/pointerAnalysis/Context.ts:132

## Methods

### emptyContext()

> **emptyContext**(): `Context`

Defined in: src/callgraph/pointerAnalysis/Context.ts:142

#### Returns

`Context`

***

### getContextByID()

> **getContextByID**(`context_id`): `undefined` \| `Context`

Defined in: src/callgraph/pointerAnalysis/Context.ts:154

#### Parameters

##### context\_id

`number`

#### Returns

`undefined` \| `Context`

***

### getContextID()

> **getContextID**(`context`): `number`

Defined in: src/callgraph/pointerAnalysis/Context.ts:150

#### Parameters

##### context

`Context`

#### Returns

`number`

***

### getEmptyContextID()

> **getEmptyContextID**(): `number`

Defined in: src/callgraph/pointerAnalysis/Context.ts:146

#### Returns

`number`

***

### getNewContextID()

> **getNewContextID**(`callerFuncId`): `number`

Defined in: src/callgraph/pointerAnalysis/Context.ts:158

#### Parameters

##### callerFuncId

`number`

#### Returns

`number`

***

### getOrNewContext()

> **getOrNewContext**(`callerCid`, `calleeFuncId`, `findCalleeAsTop`): `number`

Defined in: src/callgraph/pointerAnalysis/Context.ts:162

#### Parameters

##### callerCid

`number`

##### calleeFuncId

`number`

##### findCalleeAsTop

`boolean` = `false`

#### Returns

`number`
