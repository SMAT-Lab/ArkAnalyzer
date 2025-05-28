[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CGStat

# Class: CGStat

Defined in: src/callgraph/common/Statistics.ts:192

## Extends

- `StatTraits`

## Constructors

### Constructor

> **new CGStat**(): `CGStat`

#### Returns

`CGStat`

#### Inherited from

`StatTraits.constructor`

## Properties

### endTime

> **endTime**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:27

#### Inherited from

`StatTraits.endTime`

***

### numBlank

> **numBlank**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:199

***

### numConstructor

> **numConstructor**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:198

***

### numIntrinsic

> **numIntrinsic**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:197

***

### numReal

> **numReal**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:195

***

### numTotalNode

> **numTotalNode**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:194

***

### numVirtual

> **numVirtual**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:196

***

### startTime

> **startTime**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:26

#### Inherited from

`StatTraits.startTime`

***

### TotalTime

> **TotalTime**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:25

#### Inherited from

`StatTraits.TotalTime`

## Methods

### addNodeStat()

> **addNodeStat**(`kind`): `void`

Defined in: src/callgraph/common/Statistics.ts:210

#### Parameters

##### kind

[`CallGraphNodeKind`](../enumerations/CallGraphNodeKind.md)

#### Returns

`void`

***

### endStat()

> **endStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:205

#### Returns

`void`

***

### getStat()

> **getStat**(): `string`

Defined in: src/callgraph/common/Statistics.ts:230

#### Returns

`string`

#### Overrides

`StatTraits.getStat`

***

### printStat()

> **printStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:33

#### Returns

`void`

#### Inherited from

`StatTraits.printStat`

***

### startStat()

> **startStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:201

#### Returns

`void`
