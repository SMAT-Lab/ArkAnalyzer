[**ArkAnalyzer**](../../../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../../../globals.md) / [ts](../../../../../README.md) / [ArkTSLinter\_1\_0](../../../README.md) / [LibraryTypeCallDiagnosticCheckerNamespace](../README.md) / LibraryTypeCallDiagnosticChecker

# Class: LibraryTypeCallDiagnosticChecker

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8617

## Implements

- [`DiagnosticChecker`](../../DiagnosticCheckerNamespace/interfaces/DiagnosticChecker.md)

## Constructors

### Constructor

> **new LibraryTypeCallDiagnosticChecker**(`filteredDiagnosticMessages`): `LibraryTypeCallDiagnosticChecker`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8621

#### Parameters

##### filteredDiagnosticMessages

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

#### Returns

`LibraryTypeCallDiagnosticChecker`

## Properties

### diagnosticMessages

> **diagnosticMessages**: `undefined` \| [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8619

***

### filteredDiagnosticMessages

> **filteredDiagnosticMessages**: [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8620

***

### inLibCall

> **inLibCall**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8618

## Methods

### checkDiagnosticMessage()

> **checkDiagnosticMessage**(`msgText`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8626

#### Parameters

##### msgText

`string` | [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

#### Returns

`boolean`

#### Implementation of

[`DiagnosticChecker`](../../DiagnosticCheckerNamespace/interfaces/DiagnosticChecker.md).[`checkDiagnosticMessage`](../../DiagnosticCheckerNamespace/interfaces/DiagnosticChecker.md#checkdiagnosticmessage)

***

### checkFilteredDiagnosticMessages()

> **checkFilteredDiagnosticMessages**(`msgText`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8625

#### Parameters

##### msgText

`string` | [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

#### Returns

`boolean`

***

### checkMessageChain()

> **checkMessageChain**(`chain`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8624

#### Parameters

##### chain

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

#### Returns

`boolean`

***

### checkMessageText()

> **checkMessageText**(`msg`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8623

#### Parameters

##### msg

`string`

#### Returns

`boolean`

***

### configure()

> **configure**(`inLibCall`, `diagnosticMessages`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8622

#### Parameters

##### inLibCall

`boolean`

##### diagnosticMessages

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

#### Returns

`void`
