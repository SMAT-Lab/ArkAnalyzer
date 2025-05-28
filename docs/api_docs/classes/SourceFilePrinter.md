[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / SourceFilePrinter

# Class: SourceFilePrinter

Defined in: src/save/source/SourceFilePrinter.ts:49

## Extends

- [`Printer`](Printer.md)

## Constructors

### Constructor

> **new SourceFilePrinter**(`arkFile`): `SourceFilePrinter`

Defined in: src/save/source/SourceFilePrinter.ts:53

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`SourceFilePrinter`

#### Overrides

[`Printer`](Printer.md).[`constructor`](Printer.md#constructor)

## Properties

### arkFile

> **arkFile**: [`ArkFile`](ArkFile.md)

Defined in: src/save/source/SourceFilePrinter.ts:50

***

### items

> **items**: `Dump`[] = `[]`

Defined in: src/save/source/SourceFilePrinter.ts:51

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

[`Printer`](Printer.md).[`printer`](Printer.md#printer)

## Methods

### dump()

> **dump**(): `string`

Defined in: src/save/source/SourceFilePrinter.ts:68

ArkIR dump

#### Returns

`string`

#### Overrides

[`Printer`](Printer.md).[`dump`](Printer.md#dump)
