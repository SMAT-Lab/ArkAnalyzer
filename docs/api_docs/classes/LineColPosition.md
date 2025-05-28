[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / LineColPosition

# Class: LineColPosition

Defined in: src/core/base/Position.ts:80

## Constructors

### Constructor

> **new LineColPosition**(`lineNo`, `colNo`): `LineColPosition`

Defined in: src/core/base/Position.ts:85

#### Parameters

##### lineNo

`number`

##### colNo

`number`

#### Returns

`LineColPosition`

## Properties

### DEFAULT

> `readonly` `static` **DEFAULT**: `LineColPosition`

Defined in: src/core/base/Position.ts:83

## Methods

### getColNo()

> **getColNo**(): `number`

Defined in: src/core/base/Position.ts:93

#### Returns

`number`

***

### getLineNo()

> **getLineNo**(): `number`

Defined in: src/core/base/Position.ts:89

#### Returns

`number`

***

### buildFromNode()

> `static` **buildFromNode**(`node`, `sourceFile`): `LineColPosition`

Defined in: src/core/base/Position.ts:97

#### Parameters

##### node

[`Node`](../ArkAnalyzer/namespaces/ts/interfaces/Node.md)

##### sourceFile

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

#### Returns

`LineColPosition`
