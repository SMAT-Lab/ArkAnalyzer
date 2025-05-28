[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DominanceFinder

# Class: DominanceFinder

Defined in: src/core/graph/DominanceFinder.ts:19

## Constructors

### Constructor

> **new DominanceFinder**(`cfg`): `DominanceFinder`

Defined in: src/core/graph/DominanceFinder.ts:25

#### Parameters

##### cfg

[`Cfg`](Cfg.md)

#### Returns

`DominanceFinder`

## Methods

### getBlocks()

> **getBlocks**(): [`BasicBlock`](BasicBlock.md)[]

Defined in: src/core/graph/DominanceFinder.ts:97

#### Returns

[`BasicBlock`](BasicBlock.md)[]

***

### getBlockToIdx()

> **getBlockToIdx**(): `Map`\<[`BasicBlock`](BasicBlock.md), `number`\>

Defined in: src/core/graph/DominanceFinder.ts:101

#### Returns

`Map`\<[`BasicBlock`](BasicBlock.md), `number`\>

***

### getDominanceFrontiers()

> **getDominanceFrontiers**(`block`): `Set`\<[`BasicBlock`](BasicBlock.md)\>

Defined in: src/core/graph/DominanceFinder.ts:84

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

#### Returns

`Set`\<[`BasicBlock`](BasicBlock.md)\>

***

### getImmediateDominators()

> **getImmediateDominators**(): `number`[]

Defined in: src/core/graph/DominanceFinder.ts:105

#### Returns

`number`[]
