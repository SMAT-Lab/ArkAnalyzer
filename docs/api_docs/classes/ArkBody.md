[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkBody

# Class: ArkBody

Defined in: src/core/model/ArkBody.ts:24

## Constructors

### Constructor

> **new ArkBody**(`locals`, `cfg`, `aliasTypeMap?`, `traps?`): `ArkBody`

Defined in: src/core/model/ArkBody.ts:31

#### Parameters

##### locals

`Set`\<[`Local`](Local.md)\>

##### cfg

[`Cfg`](Cfg.md)

##### aliasTypeMap?

`Map`\<`string`, \[[`AliasType`](AliasType.md), [`ArkAliasTypeDefineStmt`](ArkAliasTypeDefineStmt.md)\]\>

##### traps?

`Trap`[]

#### Returns

`ArkBody`

## Methods

### addLocal()

> **addLocal**(`name`, `local`): `void`

Defined in: src/core/model/ArkBody.ts:50

#### Parameters

##### name

`string`

##### local

[`Local`](Local.md)

#### Returns

`void`

***

### getAliasTypeByName()

> **getAliasTypeByName**(`name`): `null` \| [`AliasType`](AliasType.md)

Defined in: src/core/model/ArkBody.ts:74

#### Parameters

##### name

`string`

#### Returns

`null` \| [`AliasType`](AliasType.md)

***

### getAliasTypeMap()

> **getAliasTypeMap**(): `undefined` \| `Map`\<`string`, \[[`AliasType`](AliasType.md), [`ArkAliasTypeDefineStmt`](ArkAliasTypeDefineStmt.md)\]\>

Defined in: src/core/model/ArkBody.ts:70

#### Returns

`undefined` \| `Map`\<`string`, \[[`AliasType`](AliasType.md), [`ArkAliasTypeDefineStmt`](ArkAliasTypeDefineStmt.md)\]\>

***

### getCfg()

> **getCfg**(): [`Cfg`](Cfg.md)

Defined in: src/core/model/ArkBody.ts:62

#### Returns

[`Cfg`](Cfg.md)

***

### getExportLocalByName()

> **getExportLocalByName**(`name`): `null` \| [`Local`](Local.md)

Defined in: src/core/model/ArkBody.ts:86

#### Parameters

##### name

`string`

#### Returns

`null` \| [`Local`](Local.md)

***

### getLocals()

> **getLocals**(): `Map`\<`string`, [`Local`](Local.md)\>

Defined in: src/core/model/ArkBody.ts:39

#### Returns

`Map`\<`string`, [`Local`](Local.md)\>

***

### getTraps()

> **getTraps**(): `undefined` \| `Trap`[]

Defined in: src/core/model/ArkBody.ts:82

#### Returns

`undefined` \| `Trap`[]

***

### getUsedGlobals()

> **getUsedGlobals**(): `undefined` \| `Map`\<`string`, [`Value`](../interfaces/Value.md)\>

Defined in: src/core/model/ArkBody.ts:54

#### Returns

`undefined` \| `Map`\<`string`, [`Value`](../interfaces/Value.md)\>

***

### setCfg()

> **setCfg**(`cfg`): `void`

Defined in: src/core/model/ArkBody.ts:66

#### Parameters

##### cfg

[`Cfg`](Cfg.md)

#### Returns

`void`

***

### setLocals()

> **setLocals**(`locals`): `void`

Defined in: src/core/model/ArkBody.ts:43

#### Parameters

##### locals

`Set`\<[`Local`](Local.md)\>

#### Returns

`void`

***

### setUsedGlobals()

> **setUsedGlobals**(`globals`): `void`

Defined in: src/core/model/ArkBody.ts:58

#### Parameters

##### globals

`Map`\<`string`, [`Value`](../interfaces/Value.md)\>

#### Returns

`void`
