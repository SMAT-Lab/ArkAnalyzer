[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / CallGraphNode

# Class: CallGraphNode

Defined in: src/callgraph/model/CallGraph.ts:83

## Extends

- [`BaseNode`](BaseNode.md)

## Constructors

### Constructor

> **new CallGraphNode**(`id`, `m`, `k`): `CallGraphNode`

Defined in: src/callgraph/model/CallGraph.ts:87

#### Parameters

##### id

`number`

##### m

[`MethodSignature`](MethodSignature.md)

##### k

[`CallGraphNodeKind`](../enumerations/CallGraphNodeKind.md) = `CallGraphNodeKind.real`

#### Returns

`CallGraphNode`

#### Overrides

[`BaseNode`](BaseNode.md).[`constructor`](BaseNode.md#constructor)

## Properties

### kind

> `protected` **kind**: `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:68

#### Inherited from

[`BaseNode`](BaseNode.md).[`kind`](BaseNode.md#kind)

## Accessors

### isBlankMethod

#### Get Signature

> **get** **isBlankMethod**(): `boolean`

Defined in: src/callgraph/model/CallGraph.ts:104

##### Returns

`boolean`

## Methods

### addIncomingEdge()

> **addIncomingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:105

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`addIncomingEdge`](BaseNode.md#addincomingedge)

***

### addOutgoingEdge()

> **addOutgoingEdge**(`e`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:109

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`addOutgoingEdge`](BaseNode.md#addoutgoingedge)

***

### getDotAttr()

> **getDotAttr**(): `string`

Defined in: src/callgraph/model/CallGraph.ts:108

#### Returns

`string`

#### Overrides

[`BaseNode`](BaseNode.md).[`getDotAttr`](BaseNode.md#getdotattr)

***

### getDotLabel()

> **getDotLabel**(): `string`

Defined in: src/callgraph/model/CallGraph.ts:115

#### Returns

`string`

#### Overrides

[`BaseNode`](BaseNode.md).[`getDotLabel`](BaseNode.md#getdotlabel)

***

### getID()

> **getID**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:77

#### Returns

`number`

#### Inherited from

[`BaseNode`](BaseNode.md).[`getID`](BaseNode.md#getid)

***

### getIncomingEdge()

> **getIncomingEdge**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:121

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`BaseNode`](BaseNode.md).[`getIncomingEdge`](BaseNode.md#getincomingedge)

***

### getKind()

> **getKind**(): `number`

Defined in: src/core/graph/BaseExplicitGraph.ts:81

#### Returns

`number`

#### Inherited from

[`BaseNode`](BaseNode.md).[`getKind`](BaseNode.md#getkind)

***

### getMethod()

> **getMethod**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/callgraph/model/CallGraph.ts:92

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### getOutgoingEdges()

> **getOutgoingEdges**(): `Set`\<[`BaseEdge`](BaseEdge.md)\>

Defined in: src/core/graph/BaseExplicitGraph.ts:125

#### Returns

`Set`\<[`BaseEdge`](BaseEdge.md)\>

#### Inherited from

[`BaseNode`](BaseNode.md).[`getOutgoingEdges`](BaseNode.md#getoutgoingedges)

***

### hasIncomingEdge()

> **hasIncomingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:97

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasIncomingEdge`](BaseNode.md#hasincomingedge)

***

### hasIncomingEdges()

> **hasIncomingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:89

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasIncomingEdges`](BaseNode.md#hasincomingedges)

***

### hasOutgoingEdge()

> **hasOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:101

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasOutgoingEdge`](BaseNode.md#hasoutgoingedge)

***

### hasOutgoingEdges()

> **hasOutgoingEdges**(): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:93

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`hasOutgoingEdges`](BaseNode.md#hasoutgoingedges)

***

### isSdkMethod()

> **isSdkMethod**(): `boolean`

Defined in: src/callgraph/model/CallGraph.ts:100

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

#### Inherited from

[`BaseNode`](BaseNode.md).[`removeIncomingEdge`](BaseNode.md#removeincomingedge)

***

### removeOutgoingEdge()

> **removeOutgoingEdge**(`e`): `boolean`

Defined in: src/core/graph/BaseExplicitGraph.ts:117

#### Parameters

##### e

[`BaseEdge`](BaseEdge.md)

#### Returns

`boolean`

#### Inherited from

[`BaseNode`](BaseNode.md).[`removeOutgoingEdge`](BaseNode.md#removeoutgoingedge)

***

### setKind()

> **setKind**(`kind`): `void`

Defined in: src/core/graph/BaseExplicitGraph.ts:85

#### Parameters

##### kind

`number`

#### Returns

`void`

#### Inherited from

[`BaseNode`](BaseNode.md).[`setKind`](BaseNode.md#setkind)

***

### setSdkMethod()

> **setSdkMethod**(`v`): `void`

Defined in: src/callgraph/model/CallGraph.ts:96

#### Parameters

##### v

`boolean`

#### Returns

`void`
