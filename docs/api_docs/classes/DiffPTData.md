[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DiffPTData

# Class: DiffPTData\<K, D, DS\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:222

## Type Parameters

### K

`K`

### D

`D` *extends* `Idx`

### DS

`DS` *extends* `IPtsCollection`\<`D`\>

## Constructors

### Constructor

> **new DiffPTData**\<`K`, `D`, `DS`\>(`DSCreator`): `DiffPTData`\<`K`, `D`, `DS`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:226

#### Parameters

##### DSCreator

() => `DS`

#### Returns

`DiffPTData`\<`K`, `D`, `DS`\>

## Methods

### addPts()

> **addPts**(`v`, `elem`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:236

#### Parameters

##### v

`K`

##### elem

`D`

#### Returns

`boolean`

***

### calculateDiff()

> **calculateDiff**(`src`, `dst`): `DS`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:364

#### Parameters

##### src

`K`

##### dst

`K`

#### Returns

`DS`

***

### clear()

> **clear**(): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:231

#### Returns

`void`

***

### clearDiffPts()

> **clearDiffPts**(`v`): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:350

#### Parameters

##### v

`K`

#### Returns

`void`

***

### clearPropaPts()

> **clearPropaPts**(`v`): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:357

#### Parameters

##### v

`K`

#### Returns

`void`

***

### clearPts()

> **clearPts**(`v`): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:339

#### Parameters

##### v

`K`

#### Returns

`void`

***

### flush()

> **flush**(`v`): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:328

#### Parameters

##### v

`K`

#### Returns

`void`

***

### getAllPropaPts()

> **getAllPropaPts**(): `Map`\<`K`, `DS`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:317

#### Returns

`Map`\<`K`, `DS`\>

***

### getDiffPts()

> **getDiffPts**(`v`): `undefined` \| `DS`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:302

#### Parameters

##### v

`K`

#### Returns

`undefined` \| `DS`

***

### getMutDiffPts()

> **getMutDiffPts**(`v`): `undefined` \| `DS`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:306

#### Parameters

##### v

`K`

#### Returns

`undefined` \| `DS`

***

### getPropaPts()

> **getPropaPts**(`v`): `undefined` \| `DS`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:313

#### Parameters

##### v

`K`

#### Returns

`undefined` \| `DS`

***

### getPropaPtsMut()

> **getPropaPtsMut**(`v`): `DS`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:321

#### Parameters

##### v

`K`

#### Returns

`DS`

***

### removePtsElem()

> **removePtsElem**(`v`, `elem`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:296

#### Parameters

##### v

`K`

##### elem

`D`

#### Returns

`boolean`

***

### resetElem()

> **resetElem**(`v`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:246

#### Parameters

##### v

`K`

#### Returns

`boolean`

***

### unionDiffPts()

> **unionDiffPts**(`dstv`, `srcv`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:255

#### Parameters

##### dstv

`K`

##### srcv

`K`

#### Returns

`boolean`

***

### unionPts()

> **unionPts**(`dstv`, `srcv`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:268

#### Parameters

##### dstv

`K`

##### srcv

`K`

#### Returns

`boolean`

***

### unionPtsTo()

> **unionPtsTo**(`dstv`, `srcDs`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:286

#### Parameters

##### dstv

`K`

##### srcDs

`DS`

#### Returns

`boolean`
