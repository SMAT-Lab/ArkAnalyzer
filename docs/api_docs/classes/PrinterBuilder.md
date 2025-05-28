[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / PrinterBuilder

# Class: PrinterBuilder

Defined in: src/save/PrinterBuilder.ts:47

## Example

```ts
// dump method IR to ts source
let method: Method = xx;
let srcPrinter = new SourceMethodPrinter(method);
PrinterBuilder.dump(srcPrinter, 'output.ts');

// dump method cfg to dot
let dotPrinter = new DotMethodPrinter(method);
PrinterBuilder.dump(dotPrinter, 'output.dot');

// dump project
let printer = new PrinterBuilder('output');
for (let f of scene.getFiles()) {
    printer.dumpToTs(f);
}
```

## Constructors

### Constructor

> **new PrinterBuilder**(`outputDir`): `PrinterBuilder`

Defined in: src/save/PrinterBuilder.ts:49

#### Parameters

##### outputDir

`string` = `''`

#### Returns

`PrinterBuilder`

## Properties

### outputDir

> **outputDir**: `string`

Defined in: src/save/PrinterBuilder.ts:48

## Methods

### dumpToDot()

> **dumpToDot**(`arkFile`, `output`): `void`

Defined in: src/save/PrinterBuilder.ts:65

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

##### output

`undefined` | `string`

#### Returns

`void`

***

### dumpToIR()

> **dumpToIR**(`arkFile`, `output`): `void`

Defined in: src/save/PrinterBuilder.ts:101

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

##### output

`undefined` | `string`

#### Returns

`void`

***

### dumpToJson()

> **dumpToJson**(`arkFile`, `output`): `void`

Defined in: src/save/PrinterBuilder.ts:90

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

##### output

`undefined` | `string`

#### Returns

`void`

***

### dumpToTs()

> **dumpToTs**(`arkFile`, `output`): `void`

Defined in: src/save/PrinterBuilder.ts:76

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

##### output

`undefined` | `string`

#### Returns

`void`

***

### getOutputDir()

> `protected` **getOutputDir**(`arkFile`): `string`

Defined in: src/save/PrinterBuilder.ts:57

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

#### Returns

`string`

***

### dump()

> `static` **dump**(`source`, `output`): `void`

Defined in: src/save/PrinterBuilder.ts:53

#### Parameters

##### source

[`Printer`](Printer.md)

##### output

`string`

#### Returns

`void`
