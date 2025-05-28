[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DominanceTree

# Class: DominanceTree

Defined in: src/core/graph/DominanceTree.ts:19

## Constructors

### Constructor

> **new DominanceTree**(`dominanceFinder`): `DominanceTree`

Defined in: src/core/graph/DominanceTree.ts:25

#### Parameters

##### dominanceFinder

[`DominanceFinder`](DominanceFinder.md)

#### Returns

`DominanceTree`

## Methods

### getAllNodesDFS()

> **getAllNodesDFS**(): [`BasicBlock`](BasicBlock.md)[]

Defined in: src/core/graph/DominanceTree.ts:46

#### Returns

[`BasicBlock`](BasicBlock.md)[]

***

### getChildren()

> **getChildren**(`block`): [`BasicBlock`](BasicBlock.md)[]

Defined in: src/core/graph/DominanceTree.ts:63

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

#### Returns

[`BasicBlock`](BasicBlock.md)[]

***

### getRoot()

> **getRoot**(): [`BasicBlock`](BasicBlock.md)

Defined in: src/core/graph/DominanceTree.ts:72

#### Returns

[`BasicBlock`](BasicBlock.md)
