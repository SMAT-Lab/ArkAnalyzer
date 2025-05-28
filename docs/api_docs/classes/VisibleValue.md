[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / VisibleValue

# Class: VisibleValue

Defined in: src/core/common/VisibleValue.ts:30

## Constructors

### Constructor

> **new VisibleValue**(): `VisibleValue`

Defined in: src/core/common/VisibleValue.ts:35

#### Returns

`VisibleValue`

## Methods

### getCurrVisibleValues()

> **getCurrVisibleValues**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/common/VisibleValue.ts:43

get values that is visible in curr scope

#### Returns

[`Value`](../interfaces/Value.md)[]

***

### getScopeChain()

> **getScopeChain**(): [`Scope`](Scope.md)[]

Defined in: src/core/common/VisibleValue.ts:47

#### Returns

[`Scope`](Scope.md)[]

***

### updateIntoScope()

> **updateIntoScope**(`model`): `void`

Defined in: src/core/common/VisibleValue.ts:52

udpate visible values after entered a scope, only support step by step

#### Parameters

##### model

`ArkModel`

#### Returns

`void`

***

### updateOutScope()

> **updateOutScope**(): `void`

Defined in: src/core/common/VisibleValue.ts:79

udpate visible values after left a scope, only support step by step

#### Returns

`void`
