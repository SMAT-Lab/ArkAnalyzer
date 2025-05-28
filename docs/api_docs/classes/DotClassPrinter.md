[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DotClassPrinter

# Class: DotClassPrinter

Defined in: src/save/DotPrinter.ts:106

## Extends

- [`Printer`](Printer.md)

## Constructors

### Constructor

> **new DotClassPrinter**(`cls`, `nesting`): `DotClassPrinter`

Defined in: src/save/DotPrinter.ts:110

#### Parameters

##### cls

[`ArkClass`](ArkClass.md)

##### nesting

`boolean` = `false`

#### Returns

`DotClassPrinter`

#### Overrides

[`Printer`](Printer.md).[`constructor`](Printer.md#constructor)

## Properties

### cls

> **cls**: [`ArkClass`](ArkClass.md)

Defined in: src/save/DotPrinter.ts:107

***

### nesting

> **nesting**: `boolean`

Defined in: src/save/DotPrinter.ts:108

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

[`Printer`](Printer.md).[`printer`](Printer.md#printer)

## Methods

### dump()

> **dump**(): `string`

Defined in: src/save/DotPrinter.ts:116

ArkIR dump

#### Returns

`string`

#### Overrides

[`Printer`](Printer.md).[`dump`](Printer.md#dump)
