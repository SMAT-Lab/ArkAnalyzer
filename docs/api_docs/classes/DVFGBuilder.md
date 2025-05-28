[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DVFGBuilder

# Class: DVFGBuilder

Defined in: src/VFG/builder/DVFGBuilder.ts:29

## Constructors

### Constructor

> **new DVFGBuilder**(`dvfg`, `s`): `DVFGBuilder`

Defined in: src/VFG/builder/DVFGBuilder.ts:33

#### Parameters

##### dvfg

[`DVFG`](DVFG.md)

##### s

[`Scene`](Scene.md)

#### Returns

`DVFGBuilder`

## Methods

### addDVFGEdges()

> **addDVFGEdges**(): `void`

Defined in: src/VFG/builder/DVFGBuilder.ts:131

#### Returns

`void`

***

### addDVFGNodes()

> **addDVFGNodes**(): `void`

Defined in: src/VFG/builder/DVFGBuilder.ts:129

#### Returns

`void`

***

### build()

> **build**(): `void`

Defined in: src/VFG/builder/DVFGBuilder.ts:38

#### Returns

`void`

***

### buildForSingleMethod()

> **buildForSingleMethod**(`m`): `void`

Defined in: src/VFG/builder/DVFGBuilder.ts:46

#### Parameters

##### m

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### getOrNewDVFGNode()

> **getOrNewDVFGNode**(`stmt`): `DVFGNode`

Defined in: src/VFG/builder/DVFGBuilder.ts:125

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`DVFGNode`
