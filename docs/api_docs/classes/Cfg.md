[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Cfg

# Class: Cfg

Defined in: src/core/graph/Cfg.ts:30

## Constructors

### Constructor

> **new Cfg**(): `Cfg`

Defined in: src/core/graph/Cfg.ts:38

#### Returns

`Cfg`

## Methods

### addBlock()

> **addBlock**(`block`): `void`

Defined in: src/core/graph/Cfg.ts:114

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

#### Returns

`void`

***

### buildDefUseChain()

> **buildDefUseChain**(): `void`

Defined in: src/core/graph/Cfg.ts:230

#### Returns

`void`

***

### buildDefUseStmt()

> **buildDefUseStmt**(`locals`): `void`

Defined in: src/core/graph/Cfg.ts:155

#### Parameters

##### locals

`Set`\<[`Local`](Local.md)\>

#### Returns

`void`

***

### getBlocks()

> **getBlocks**(): `Set`\<[`BasicBlock`](BasicBlock.md)\>

Defined in: src/core/graph/Cfg.ts:122

#### Returns

`Set`\<[`BasicBlock`](BasicBlock.md)\>

***

### getDeclaringMethod()

> **getDeclaringMethod**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/graph/Cfg.ts:138

#### Returns

[`ArkMethod`](ArkMethod.md)

***

### getDefUseChains()

> **getDefUseChains**(): [`DefUseChain`](DefUseChain.md)[]

Defined in: src/core/graph/Cfg.ts:146

#### Returns

[`DefUseChain`](DefUseChain.md)[]

***

### getStartingBlock()

> **getStartingBlock**(): `undefined` \| [`BasicBlock`](BasicBlock.md)

Defined in: src/core/graph/Cfg.ts:126

#### Returns

`undefined` \| [`BasicBlock`](BasicBlock.md)

***

### getStartingStmt()

> **getStartingStmt**(): [`Stmt`](Stmt.md)

Defined in: src/core/graph/Cfg.ts:130

#### Returns

[`Stmt`](Stmt.md)

***

### getStmts()

> **getStmts**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/graph/Cfg.ts:40

#### Returns

[`Stmt`](Stmt.md)[]

***

### getUnreachableBlocks()

> **getUnreachableBlocks**(): `Set`\<[`BasicBlock`](BasicBlock.md)\>

Defined in: src/core/graph/Cfg.ts:241

#### Returns

`Set`\<[`BasicBlock`](BasicBlock.md)\>

***

### insertAfter()

> **insertAfter**(`toInsert`, `point`): `number`

Defined in: src/core/graph/Cfg.ts:54

Inserts toInsert in the basic block in CFG after point.

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

Defined in: src/core/graph/Cfg.ts:70

Inserts toInsert in the basic block in CFG befor point.

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

Defined in: src/core/graph/Cfg.ts:85

Removes the given stmt from the basic block in CFG.

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### setDeclaringMethod()

> **setDeclaringMethod**(`method`): `void`

Defined in: src/core/graph/Cfg.ts:142

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### setStartingStmt()

> **setStartingStmt**(`newStartingStmt`): `void`

Defined in: src/core/graph/Cfg.ts:134

#### Parameters

##### newStartingStmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/graph/Cfg.ts:151

#### Returns

`string`

***

### updateStmt2BlockMap()

> **updateStmt2BlockMap**(`block`, `changed?`): `void`

Defined in: src/core/graph/Cfg.ts:99

Update stmtToBlock Map

#### Parameters

##### block

[`BasicBlock`](BasicBlock.md)

##### changed?

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/graph/Cfg.ts:256

#### Returns

`ArkError`
