[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PTAStat

# Class: PTAStat

Defined in: src/callgraph/common/Statistics.ts:38

## Extends

- `StatTraits`

## Constructors

### Constructor

> **new PTAStat**(`pta`): `PTAStat`

Defined in: src/callgraph/common/Statistics.ts:69

#### Parameters

##### pta

[`PointerAnalysis`](PointerAnalysis.md)

#### Returns

`PTAStat`

#### Overrides

`StatTraits.constructor`

## Properties

### endMemUsage

> **endMemUsage**: `any`

Defined in: src/callgraph/common/Statistics.ts:65

***

### endTime

> **endTime**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:27

#### Inherited from

`StatTraits.endTime`

***

### heapUsed

> **heapUsed**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:67

***

### iterTimes

> **iterTimes**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:62

***

### numInferedDiffTypeValue

> **numInferedDiffTypeValue**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:55

***

### numInferedUnknownValue

> **numInferedUnknownValue**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:53

***

### numNotInferedUnknownValue

> **numNotInferedUnknownValue**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:59

***

### numProcessedAddr

> **numProcessedAddr**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:40

***

### numProcessedCopy

> **numProcessedCopy**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:41

***

### numProcessedLoad

> **numProcessedLoad**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:42

***

### numProcessedThis

> **numProcessedThis**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:44

***

### numProcessedWrite

> **numProcessedWrite**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:43

***

### numRealLoad

> **numRealLoad**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:46

***

### numRealWrite

> **numRealWrite**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:45

***

### numTotalHandledValue

> **numTotalHandledValue**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:50

***

### numTotalValuesInHandedFun

> **numTotalValuesInHandedFun**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:49

***

### numUnhandledFun

> **numUnhandledFun**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:48

***

### numUnhandledFunc

> **numUnhandledFunc**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:60

***

### pta

> **pta**: [`PointerAnalysis`](PointerAnalysis.md)

Defined in: src/callgraph/common/Statistics.ts:39

***

### rssUsed

> **rssUsed**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:66

***

### startMemUsage

> **startMemUsage**: `any`

Defined in: src/callgraph/common/Statistics.ts:64

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

***

### totalValuesInVisitedFunc

> **totalValuesInVisitedFunc**: `number` = `0`

Defined in: src/callgraph/common/Statistics.ts:57

## Methods

### endStat()

> **endStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:79

#### Returns

`void`

***

### getNow()

> **getNow**(): `number`

Defined in: src/callgraph/common/Statistics.ts:89

#### Returns

`number`

***

### getStat()

> **getStat**(): `string`

Defined in: src/callgraph/common/Statistics.ts:147

#### Returns

`string`

#### Overrides

`StatTraits.getStat`

***

### printStat()

> **printStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:168

#### Returns

`void`

#### Overrides

`StatTraits.printStat`

***

### startStat()

> **startStat**(): `void`

Defined in: src/callgraph/common/Statistics.ts:74

#### Returns

`void`
