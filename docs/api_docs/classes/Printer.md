[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Printer

# Class: `abstract` Printer

Defined in: src/save/Printer.ts:21

## Extended by

- [`DotMethodPrinter`](DotMethodPrinter.md)
- [`DotClassPrinter`](DotClassPrinter.md)
- [`DotNamespacePrinter`](DotNamespacePrinter.md)
- [`DotFilePrinter`](DotFilePrinter.md)
- [`SourceFilePrinter`](SourceFilePrinter.md)
- [`JsonPrinter`](JsonPrinter.md)
- [`GraphPrinter`](GraphPrinter.md)
- [`ViewTreePrinter`](ViewTreePrinter.md)

## Constructors

### Constructor

> **new Printer**(`indent`): `Printer`

Defined in: src/save/Printer.ts:24

#### Parameters

##### indent

`string` = `''`

#### Returns

`Printer`

## Properties

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

## Methods

### dump()

> `abstract` **dump**(): `string`

Defined in: src/save/Printer.ts:31

ArkIR dump

#### Returns

`string`
