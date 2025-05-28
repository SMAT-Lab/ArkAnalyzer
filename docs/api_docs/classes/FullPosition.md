[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / FullPosition

# Class: FullPosition

Defined in: src/core/base/Position.ts:104

## Constructors

### Constructor

> **new FullPosition**(`firstLine`, `firstCol`, `lastLine`, `lastCol`): `FullPosition`

Defined in: src/core/base/Position.ts:110

#### Parameters

##### firstLine

`number`

##### firstCol

`number`

##### lastLine

`number`

##### lastCol

`number`

#### Returns

`FullPosition`

## Properties

### DEFAULT

> `readonly` `static` **DEFAULT**: `FullPosition`

Defined in: src/core/base/Position.ts:108

## Methods

### getFirstCol()

> **getFirstCol**(): `number`

Defined in: src/core/base/Position.ts:123

#### Returns

`number`

***

### getFirstLine()

> **getFirstLine**(): `number`

Defined in: src/core/base/Position.ts:115

#### Returns

`number`

***

### getLastCol()

> **getLastCol**(): `number`

Defined in: src/core/base/Position.ts:127

#### Returns

`number`

***

### getLastLine()

> **getLastLine**(): `number`

Defined in: src/core/base/Position.ts:119

#### Returns

`number`

***

### buildFromNode()

> `static` **buildFromNode**(`node`, `sourceFile`): `FullPosition`

Defined in: src/core/base/Position.ts:131

#### Parameters

##### node

[`Node`](../ArkAnalyzer/namespaces/ts/interfaces/Node.md)

##### sourceFile

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

#### Returns

`FullPosition`

***

### merge()

> `static` **merge**(`leftMostPosition`, `rightMostPosition`): `FullPosition`

Defined in: src/core/base/Position.ts:139

#### Parameters

##### leftMostPosition

`FullPosition`

##### rightMostPosition

`FullPosition`

#### Returns

`FullPosition`
