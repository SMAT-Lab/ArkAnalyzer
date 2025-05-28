[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / BasicBlock

# Class: BasicBlock

Defined in: src/core/graph/BasicBlock.ts:31

## Constructors

### Constructor

> **new BasicBlock**(): `BasicBlock`

Defined in: src/core/graph/BasicBlock.ts:38

#### Returns

`BasicBlock`

## Methods

### addExceptionalSuccessorBlock()

> **addExceptionalSuccessorBlock**(`block`): `void`

Defined in: src/core/graph/BasicBlock.ts:282

#### Parameters

##### block

`BasicBlock`

#### Returns

`void`

***

### addHead()

> **addHead**(`stmt`): `void`

Defined in: src/core/graph/BasicBlock.ts:64

Adds the given stmt at the beginning of the basic block.

#### Parameters

##### stmt

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

#### Returns

`void`

***

### addPredecessorBlock()

> **addPredecessorBlock**(`block`): `void`

Defined in: src/core/graph/BasicBlock.ts:184

#### Parameters

##### block

`BasicBlock`

#### Returns

`void`

***

### addStmt()

> **addStmt**(`stmt`): `void`

Defined in: src/core/graph/BasicBlock.ts:56

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### addStmtToFirst()

> **addStmtToFirst**(`stmt`): `void`

Defined in: src/core/graph/BasicBlock.ts:205

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### addSuccessorBlock()

> **addSuccessorBlock**(`block`): `void`

Defined in: src/core/graph/BasicBlock.ts:210

#### Parameters

##### block

`BasicBlock`

#### Returns

`void`

***

### addTail()

> **addTail**(`stmt`): `void`

Defined in: src/core/graph/BasicBlock.ts:76

Adds the given stmt at the end of the basic block.

#### Parameters

##### stmt

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

#### Returns

`void`

***

### getExceptionalSuccessorBlocks()

> **getExceptionalSuccessorBlocks**(): `undefined` \| `BasicBlock`[]

Defined in: src/core/graph/BasicBlock.ts:278

#### Returns

`undefined` \| `BasicBlock`[]

***

### getHead()

> **getHead**(): `null` \| [`Stmt`](Stmt.md)

Defined in: src/core/graph/BasicBlock.ts:139

#### Returns

`null` \| [`Stmt`](Stmt.md)

***

### getId()

> **getId**(): `number`

Defined in: src/core/graph/BasicBlock.ts:40

#### Returns

`number`

***

### getPredecessors()

> **getPredecessors**(): `BasicBlock`[]

Defined in: src/core/graph/BasicBlock.ts:180

Returns predecessors of the current basic block, whose types are also basic blocks.

#### Returns

`BasicBlock`[]

An array of basic blocks.

***

### getStmts()

> **getStmts**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/graph/BasicBlock.ts:52

Returns an array of the statements in a basic block.

#### Returns

[`Stmt`](Stmt.md)[]

An array of statements in a basic block.

***

### getSuccessors()

> **getSuccessors**(): `BasicBlock`[]

Defined in: src/core/graph/BasicBlock.ts:172

Returns successors of the current basic block, whose types are also basic blocks (i.e.BasicBlock).

#### Returns

`BasicBlock`[]

Successors of the current basic block.

#### Example

1. get block successors.

```typescript
const body = arkMethod.getBody();
const blocks = [...body.getCfg().getBlocks()]
for (let i = 0; i < blocks.length; i++) {
const block = blocks[i]
   ...
   for (const next of block.getSuccessors()) {
   ...
   }
} 
```

***

### getTail()

> **getTail**(): `null` \| [`Stmt`](Stmt.md)

Defined in: src/core/graph/BasicBlock.ts:146

#### Returns

`null` \| [`Stmt`](Stmt.md)

***

### insertAfter()

> **insertAfter**(`toInsert`, `point`): `number`

Defined in: src/core/graph/BasicBlock.ts:90

Inserts toInsert in the basic block after point.

#### Parameters

##### toInsert

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

##### point

[`Stmt`](Stmt.md)

#### Returns

`number`

The number of successfully inserted statements

***

### insertBefore()

> **insertBefore**(`toInsert`, `point`): `number`

Defined in: src/core/graph/BasicBlock.ts:104

Inserts toInsert in the basic block befor point.

#### Parameters

##### toInsert

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

##### point

[`Stmt`](Stmt.md)

#### Returns

`number`

The number of successfully inserted statements

***

### remove()

> **remove**(`stmt`): `void`

Defined in: src/core/graph/BasicBlock.ts:117

Removes the given stmt from this basic block.

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### removeHead()

> **removeHead**(): `void`

Defined in: src/core/graph/BasicBlock.ts:128

Removes the first stmt from this basic block.

#### Returns

`void`

***

### removePredecessorBlock()

> **removePredecessorBlock**(`block`): `boolean`

Defined in: src/core/graph/BasicBlock.ts:214

#### Parameters

##### block

`BasicBlock`

#### Returns

`boolean`

***

### removeSuccessorBlock()

> **removeSuccessorBlock**(`block`): `boolean`

Defined in: src/core/graph/BasicBlock.ts:223

#### Parameters

##### block

`BasicBlock`

#### Returns

`boolean`

***

### removeTail()

> **removeTail**(): `void`

Defined in: src/core/graph/BasicBlock.ts:135

Removes the last stmt from this basic block.

#### Returns

`void`

***

### setId()

> **setId**(`id`): `void`

Defined in: src/core/graph/BasicBlock.ts:44

#### Parameters

##### id

`number`

#### Returns

`void`

***

### setPredecessorBlock()

> **setPredecessorBlock**(`idx`, `block`): `boolean`

Defined in: src/core/graph/BasicBlock.ts:188

#### Parameters

##### idx

`number`

##### block

`BasicBlock`

#### Returns

`boolean`

***

### setSuccessorBlock()

> **setSuccessorBlock**(`idx`, `block`): `boolean`

Defined in: src/core/graph/BasicBlock.ts:196

#### Parameters

##### idx

`number`

##### block

`BasicBlock`

#### Returns

`boolean`

***

### toString()

> **toString**(): `string`

Defined in: src/core/graph/BasicBlock.ts:232

#### Returns

`string`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/graph/BasicBlock.ts:240

#### Returns

`ArkError`
