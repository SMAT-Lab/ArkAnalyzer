[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / GraphPrinter

# Class: GraphPrinter\<GraphType\>

Defined in: src/save/GraphPrinter.ts:64

## Extends

- [`Printer`](Printer.md)

## Type Parameters

### GraphType

`GraphType` *extends* `GraphTraits`\<[`BaseNode`](BaseNode.md)\>

## Constructors

### Constructor

> **new GraphPrinter**\<`GraphType`\>(`g`, `t?`): `GraphPrinter`\<`GraphType`\>

Defined in: src/save/GraphPrinter.ts:69

#### Parameters

##### g

`GraphType`

##### t?

`string`

#### Returns

`GraphPrinter`\<`GraphType`\>

#### Overrides

[`Printer`](Printer.md).[`constructor`](Printer.md#constructor)

## Properties

### graph

> **graph**: `GraphType`

Defined in: src/save/GraphPrinter.ts:65

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

[`Printer`](Printer.md).[`printer`](Printer.md#printer)

***

### startID

> **startID**: `undefined` \| `number` = `undefined`

Defined in: src/save/GraphPrinter.ts:67

***

### title

> **title**: `string`

Defined in: src/save/GraphPrinter.ts:66

## Methods

### dump()

> **dump**(): `string`

Defined in: src/save/GraphPrinter.ts:81

ArkIR dump

#### Returns

`string`

#### Overrides

[`Printer`](Printer.md).[`dump`](Printer.md#dump)

***

### setStartID()

> **setStartID**(`n`): `void`

Defined in: src/save/GraphPrinter.ts:77

#### Parameters

##### n

`number`

#### Returns

`void`

***

### writeEdge()

> **writeEdge**(`edge`): `void`

Defined in: src/save/GraphPrinter.ts:126

#### Parameters

##### edge

[`BaseEdge`](BaseEdge.md)

#### Returns

`void`

***

### writeFooter()

> **writeFooter**(): `void`

Defined in: src/save/GraphPrinter.ts:146

#### Returns

`void`

***

### writeGraph()

> **writeGraph**(): `void`

Defined in: src/save/GraphPrinter.ts:87

#### Returns

`void`

***

### writeHeader()

> **writeHeader**(): `void`

Defined in: src/save/GraphPrinter.ts:134

#### Returns

`void`

***

### writeNodes()

> **writeNodes**(): `void`

Defined in: src/save/GraphPrinter.ts:93

#### Returns

`void`
