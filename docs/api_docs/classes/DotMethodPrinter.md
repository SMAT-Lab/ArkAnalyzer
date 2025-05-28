[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DotMethodPrinter

# Class: DotMethodPrinter

Defined in: src/save/DotPrinter.ts:27

## Extends

- [`Printer`](Printer.md)

## Constructors

### Constructor

> **new DotMethodPrinter**(`method`, `nesting`): `DotMethodPrinter`

Defined in: src/save/DotPrinter.ts:31

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

##### nesting

`boolean` = `false`

#### Returns

`DotMethodPrinter`

#### Overrides

[`Printer`](Printer.md).[`constructor`](Printer.md#constructor)

## Properties

### method

> **method**: [`ArkMethod`](ArkMethod.md)

Defined in: src/save/DotPrinter.ts:28

***

### nesting

> **nesting**: `boolean`

Defined in: src/save/DotPrinter.ts:29

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

[`Printer`](Printer.md).[`printer`](Printer.md#printer)

## Methods

### dump()

> **dump**(): `string`

Defined in: src/save/DotPrinter.ts:37

ArkIR dump

#### Returns

`string`

#### Overrides

[`Printer`](Printer.md).[`dump`](Printer.md#dump)

***

### stringHashCode()

> `protected` **stringHashCode**(`name`): `number`

Defined in: src/save/DotPrinter.ts:57

#### Parameters

##### name

`string`

#### Returns

`number`
