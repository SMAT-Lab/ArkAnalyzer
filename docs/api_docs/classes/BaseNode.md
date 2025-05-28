[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / BaseNode

# Class: `abstract` BaseNode

Defined in: src/core/graph/BaseExplicitGraph.ts:66

## Extended by

- [`CallGraphNode`](CallGraphNode.md)
- [`PagNode`](PagNode.md)

## Constructors

### Constructor

> **new BaseNode**(`id`, `k`): `BaseNode`

Defined in: src/core/graph/BaseExplicitGraph.ts:72

#### Parameters

##### id

`number`

##### k

`number`

#### Returns

`BaseNode`

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:68

## Methods

### addIncomingEdge()

> **addIncomingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:105

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

***

### addOutgoingEdge()

> **addOutgoingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:109

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

***

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/core/graph/BaseExplicitGraph.ts:129

#### Returns

`string`

***

### getDotLabel()

> `abstract` **getDotLabel**(): `string`

Defined in: src/core/graph/BaseExplicitGraph.ts:133

#### Returns

`string`

***

### getID()

> **getID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:77

#### Returns

`number`

***

### getIncomingEdge()

> **getIncomingEdge**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:121

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:81

#### Returns

`number`

***

### getOutgoingEdges()

> **getOutgoingEdges**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:125

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

***

### hasIncomingEdge()

> **hasIncomingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:97

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

***

### hasIncomingEdges()

> **hasIncomingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:89

#### Returns

`boolean`

***

### hasOutgoingEdge()

> **hasOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:101

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

***

### hasOutgoingEdges()

> **hasOutgoingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:93

#### Returns

`boolean`

***

### removeIncomingEdge()

> **removeIncomingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:113

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

***

### removeOutgoingEdge()

> **removeOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:117

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

***

### setKind()

> **setKind**(`kind`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:85

#### Parameters

##### kind

`number`

#### Returns

`void`
