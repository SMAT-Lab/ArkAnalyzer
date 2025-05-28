[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / SourceClassPrinter

# Class: SourceClassPrinter

Defined in: src/save/source/SourceClass.ts:32

## Extends

- `SourceBase`

## Constructors

### Constructor

> **new SourceClassPrinter**(`cls`, `indent`): `SourceClass`

Defined in: src/save/source/SourceClass.ts:36

#### Parameters

##### cls

[`ArkClass`](ArkClass.md)

##### indent

`string` = `''`

#### Returns

`SourceClass`

#### Overrides

`SourceBase.constructor`

## Properties

### arkFile

> `protected` **arkFile**: [`ArkFile`](ArkFile.md)

Defined in: src/save/source/SourceBase.ts:27

#### Inherited from

`SourceBase.arkFile`

***

### cls

> `protected` **cls**: [`ArkClass`](ArkClass.md)

Defined in: src/save/source/SourceClass.ts:33

***

### inBuilder

> `protected` **inBuilder**: `boolean` = `false`

Defined in: src/save/source/SourceBase.ts:28

#### Inherited from

`SourceBase.inBuilder`

***

### printer

> `protected` **printer**: `ArkCodeBuffer`

Defined in: src/save/Printer.ts:22

#### Inherited from

`SourceBase.printer`

## Methods

### classOriginTypeToString()

> `protected` **classOriginTypeToString**(`clsCategory`): `string`

Defined in: src/save/base/BasePrinter.ts:75

#### Parameters

##### clsCategory

`ClassCategory`

#### Returns

`string`

#### Inherited from

`SourceBase.classOriginTypeToString`

***

### dump()

> **dump**(): `string`

Defined in: src/save/source/SourceClass.ts:50

ArkIR dump

#### Returns

`string`

#### Overrides

`SourceBase.dump`

***

### getArkFile()

> **getArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/save/source/SourceBase.ts:39

#### Returns

[`ArkFile`](ArkFile.md)

#### Inherited from

`SourceBase.getArkFile`

***

### getClass()

> **getClass**(`signature`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/save/source/SourceBase.ts:47

#### Parameters

##### signature

[`ClassSignature`](ClassSignature.md)

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

#### Inherited from

`SourceBase.getClass`

***

### getDeclaringArkNamespace()

> **getDeclaringArkNamespace**(): `undefined` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/save/source/SourceClass.ts:42

#### Returns

`undefined` \| [`ArkNamespace`](ArkNamespace.md)

#### Overrides

`SourceBase.getDeclaringArkNamespace`

***

### getLine()

> **getLine**(): `number`

Defined in: src/save/source/SourceClass.ts:46

#### Returns

`number`

#### Overrides

`SourceBase.getLine`

***

### getMethod()

> **getMethod**(`signature`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/save/source/SourceBase.ts:43

#### Parameters

##### signature

[`MethodSignature`](MethodSignature.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

#### Inherited from

`SourceBase.getMethod`

***

### getPrinter()

> **getPrinter**(): `ArkCodeBuffer`

Defined in: src/save/source/SourceBase.ts:51

#### Returns

`ArkCodeBuffer`

#### Inherited from

`SourceBase.getPrinter`

***

### isInBuilderMethod()

> **isInBuilderMethod**(): `boolean`

Defined in: src/save/source/SourceBase.ts:59

#### Returns

`boolean`

#### Inherited from

`SourceBase.isInBuilderMethod`

***

### modifiersToString()

> `protected` **modifiersToString**(`modifiers`): `string`

Defined in: src/save/base/BasePrinter.ts:57

#### Parameters

##### modifiers

`number`

#### Returns

`string`

#### Inherited from

`SourceBase.modifiersToString`

***

### printComments()

> `protected` **printComments**(`commentsMetadata`): `void`

Defined in: src/save/base/BasePrinter.ts:50

#### Parameters

##### commentsMetadata

`CommentsMetadata`

#### Returns

`void`

#### Inherited from

`SourceBase.printComments`

***

### printDecorator()

> `protected` **printDecorator**(`docorator`): `void`

Defined in: src/save/base/BasePrinter.ts:44

#### Parameters

##### docorator

[`Decorator`](Decorator.md)[]

#### Returns

`void`

#### Inherited from

`SourceBase.printDecorator`

***

### printMethods()

> `protected` **printMethods**(): `Dump`[]

Defined in: src/save/source/SourceClass.ts:153

#### Returns

`Dump`[]

***

### resolveKeywordType()

> `protected` **resolveKeywordType**(`keywordStr`): `string`

Defined in: src/save/source/SourceBase.ts:63

#### Parameters

##### keywordStr

`string`

#### Returns

`string`

#### Inherited from

`SourceBase.resolveKeywordType`

***

### resolveMethodName()

> `protected` **resolveMethodName**(`name`): `string`

Defined in: src/save/base/BasePrinter.ts:62

#### Parameters

##### name

`string`

#### Returns

`string`

#### Inherited from

`SourceBase.resolveMethodName`

***

### transTemp2Code()

> **transTemp2Code**(`temp`): `string`

Defined in: src/save/source/SourceBase.ts:55

#### Parameters

##### temp

[`Local`](Local.md)

#### Returns

`string`

#### Inherited from

`SourceBase.transTemp2Code`

***

### getPrinterOptions()

> `static` **getPrinterOptions**(): `PrinterOptions`

Defined in: src/save/base/BasePrinter.ts:85

#### Returns

`PrinterOptions`

#### Inherited from

`SourceBase.getPrinterOptions`
