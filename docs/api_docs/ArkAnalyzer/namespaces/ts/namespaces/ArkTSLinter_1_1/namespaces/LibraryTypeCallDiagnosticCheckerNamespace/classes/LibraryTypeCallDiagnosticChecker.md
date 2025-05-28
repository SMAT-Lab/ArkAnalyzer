[**ArkAnalyzer**](../../../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../../../globals.md) / [ts](../../../../../README.md) / [ArkTSLinter\_1\_1](../../../README.md) / [LibraryTypeCallDiagnosticCheckerNamespace](../README.md) / LibraryTypeCallDiagnosticChecker

# Class: LibraryTypeCallDiagnosticChecker

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9126

## Implements

- [`DiagnosticChecker`](../../DiagnosticCheckerNamespace/interfaces/DiagnosticChecker.md)

## Constructors

### Constructor

> **new LibraryTypeCallDiagnosticChecker**(`filteredDiagnosticMessages`): `LibraryTypeCallDiagnosticChecker`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9130

#### Parameters

##### filteredDiagnosticMessages

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

#### Returns

`LibraryTypeCallDiagnosticChecker`

## Properties

### diagnosticMessages

> **diagnosticMessages**: `undefined` \| [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9128

***

### filteredDiagnosticMessages

> **filteredDiagnosticMessages**: [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9129

***

### inLibCall

> **inLibCall**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9127

## Methods

### checkDiagnosticMessage()

> **checkDiagnosticMessage**(`msgText`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9135

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

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9134

#### Parameters

##### msgText

`string` | [`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

#### Returns

`boolean`

***

### checkMessageText()

> **checkMessageText**(`msg`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9132

#### Parameters

##### msg

`string`

#### Returns

`boolean`

***

### configure()

> **configure**(`inLibCall`, `diagnosticMessages`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9131

#### Parameters

##### inLibCall

`boolean`

##### diagnosticMessages

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)[]

#### Returns

`void`

***

### checkMessageChain()

> `static` **checkMessageChain**(`chain`, `inLibCall`): [`ErrorType`](../enumerations/ErrorType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9133

#### Parameters

##### chain

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

##### inLibCall

`boolean`

#### Returns

[`ErrorType`](../enumerations/ErrorType.md)

***

### collectDiagnosticMessage()

> `static` **collectDiagnosticMessage**(`diagnosticMessageChain`, `textSet`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9137

#### Parameters

##### diagnosticMessageChain

[`DiagnosticMessageChain`](../../../../../interfaces/DiagnosticMessageChain.md)

##### textSet

[`Set`](../../../../../interfaces/Set.md)\<`string`\>

#### Returns

`void`

***

### rebuildTscDiagnostics()

> `static` **rebuildTscDiagnostics**(`tscStrictDiagnostics`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:9136

#### Parameters

##### tscStrictDiagnostics

[`Map`](../../../../../interfaces/Map.md)\<[`Diagnostic`](../../../../../interfaces/Diagnostic.md)[]\>

#### Returns

`void`
