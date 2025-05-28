[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PtsSet

# Class: PtsSet\<T\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:50

## Type Parameters

### T

`T` *extends* `Idx`

## Implements

- `IPtsCollection`\<`T`\>

## Constructors

### Constructor

> **new PtsSet**\<`T`\>(): `PtsSet`\<`T`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:53

#### Returns

`PtsSet`\<`T`\>

## Properties

### pts

> **pts**: `Set`\<`T`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:51

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<`T`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:137

#### Returns

`IterableIterator`\<`T`\>

#### Implementation of

`IPtsCollection.[iterator]`

***

### clear()

> **clear**(): `void`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:101

#### Returns

`void`

#### Implementation of

`IPtsCollection.clear`

***

### clone()

> **clone**(): `this`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:77

#### Returns

`this`

#### Implementation of

`IPtsCollection.clone`

***

### contains()

> **contains**(`elem`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:57

#### Parameters

##### elem

`T`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.contains`

***

### count()

> **count**(): `number`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:105

#### Returns

`number`

#### Implementation of

`IPtsCollection.count`

***

### getProtoPtsSet()

> **getProtoPtsSet**(): `Set`\<`T`\>

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:133

#### Returns

`Set`\<`T`\>

#### Implementation of

`IPtsCollection.getProtoPtsSet`

***

### insert()

> **insert**(`elem`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:61

#### Parameters

##### elem

`T`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.insert`

***

### intersect()

> **intersect**(`other`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:124

#### Parameters

##### other

`this`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.intersect`

***

### isEmpty()

> **isEmpty**(): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:109

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.isEmpty`

***

### remove()

> **remove**(`elem`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:69

#### Parameters

##### elem

`T`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.remove`

***

### subtract()

> **subtract**(`other`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:92

#### Parameters

##### other

`this`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.subtract`

***

### superset()

> **superset**(`other`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:114

#### Parameters

##### other

`this`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.superset`

***

### union()

> **union**(`other`): `boolean`

Defined in: src/callgraph/pointerAnalysis/PtsDS.ts:84

#### Parameters

##### other

`this`

#### Returns

`boolean`

#### Implementation of

`IPtsCollection.union`
