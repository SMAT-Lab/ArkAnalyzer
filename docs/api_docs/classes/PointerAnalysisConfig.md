[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PointerAnalysisConfig

# Class: PointerAnalysisConfig

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:25

## Constructors

### Constructor

> **new PointerAnalysisConfig**(`kLimit`, `outputDirectory`, `detectTypeDiff`, `dotDump`, `unhandledFuncDump`, `analysisScale`, `ptsCoType`): `PointerAnalysisConfig`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:41

#### Parameters

##### kLimit

`number`

##### outputDirectory

`string`

##### detectTypeDiff

`boolean` = `false`

##### dotDump

`boolean` = `false`

##### unhandledFuncDump

`boolean` = `false`

##### analysisScale

`PtaAnalysisScale` = `PtaAnalysisScale.WholeProgram`

##### ptsCoType

`PtsCollectionType` = `PtsCollectionType.Set`

#### Returns

`PointerAnalysisConfig`

## Properties

### analysisScale

> **analysisScale**: `PtaAnalysisScale`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:33

***

### detectTypeDiff

> **detectTypeDiff**: `boolean`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:30

***

### dotDump

> **dotDump**: `boolean`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:31

***

### kLimit

> **kLimit**: `number`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:28

***

### outputDirectory

> **outputDirectory**: `string`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:29

***

### ptsCollectionCtor()

> **ptsCollectionCtor**: () => `IPtsCollection`\<`number`\>

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:35

#### Returns

`IPtsCollection`\<`number`\>

***

### ptsCollectionType

> **ptsCollectionType**: `PtsCollectionType`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:34

***

### unhandledFuncDump

> **unhandledFuncDump**: `boolean`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:32

## Methods

### create()

> `static` **create**(`kLimit`, `outputDirectory`, `detectTypeDiff`, `dotDump`, `unhandledFuncDump`, `analysisScale`, `ptsCoType`): `PointerAnalysisConfig`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:71

#### Parameters

##### kLimit

`number`

##### outputDirectory

`string`

##### detectTypeDiff

`boolean` = `false`

##### dotDump

`boolean` = `false`

##### unhandledFuncDump

`boolean` = `false`

##### analysisScale

`PtaAnalysisScale` = `PtaAnalysisScale.WholeProgram`

##### ptsCoType

`PtsCollectionType` = `PtsCollectionType.Set`

#### Returns

`PointerAnalysisConfig`

***

### getInstance()

> `static` **getInstance**(): `PointerAnalysisConfig`

Defined in: src/callgraph/pointerAnalysis/PointerAnalysisConfig.ts:95

#### Returns

`PointerAnalysisConfig`
