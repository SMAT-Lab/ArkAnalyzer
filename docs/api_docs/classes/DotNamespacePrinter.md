[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DotNamespacePrinter

# Class: DotNamespacePrinter

Defined in: src/save/DotPrinter.ts:140

## Extends

- [`Printer`](Printer.md)

## Constructors

### Constructor

> **new DotNamespacePrinter**(`ns`, `nesting`): `DotNamespacePrinter`

Defined in: src/save/DotPrinter.ts:144

#### Parameters

##### ns

[`ArkNamespace`](ArkNamespace.md)

##### nesting

`boolean` = `false`

#### Returns

`DotNamespacePrinter`

#### Overrides

[`Printer`](Printer.md).[`constructor`](Printer.md#constructor)

## Properties

### nesting

> **nesting**: `boolean`

Defined in: src/save/DotPrinter.ts:142

***

### ns

> **ns**: [`ArkNamespace`](ArkNamespace.md)

Defined in: src/save/DotPrinter.ts:141

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

[`Printer`](Printer.md).[`printer`](Printer.md#printer)

## Methods

### dump()

> **dump**(): `string`

Defined in: src/save/DotPrinter.ts:150

ArkIR dump

#### Returns

`string`

#### Overrides

[`Printer`](Printer.md).[`dump`](Printer.md#dump)
