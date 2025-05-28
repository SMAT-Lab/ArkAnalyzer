[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Scanner

# Interface: Scanner

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4574

## Methods

### getStartPos()

> **getStartPos**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4575

#### Returns

`number`

***

### getText()

> **getText**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4603

#### Returns

`string`

***

### getTextPos()

> **getTextPos**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4577

#### Returns

`number`

***

### getToken()

> **getToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4576

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### getTokenPos()

> **getTokenPos**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4578

#### Returns

`number`

***

### getTokenText()

> **getTokenText**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4579

#### Returns

`string`

***

### getTokenValue()

> **getTokenValue**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4580

#### Returns

`string`

***

### hasExtendedUnicodeEscape()

> **hasExtendedUnicodeEscape**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4582

#### Returns

`boolean`

***

### hasPrecedingLineBreak()

> **hasPrecedingLineBreak**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4583

#### Returns

`boolean`

***

### hasUnicodeEscape()

> **hasUnicodeEscape**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4581

#### Returns

`boolean`

***

### isIdentifier()

> **isIdentifier**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4584

#### Returns

`boolean`

***

### isReservedWord()

> **isReservedWord**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4585

#### Returns

`boolean`

***

### isUnterminated()

> **isUnterminated**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4586

#### Returns

`boolean`

***

### lookAhead()

> **lookAhead**\<`T`\>(`callback`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4609

#### Type Parameters

##### T

`T`

#### Parameters

##### callback

() => `T`

#### Returns

`T`

***

### reScanAsteriskEqualsToken()

> **reScanAsteriskEqualsToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4589

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanGreaterToken()

> **reScanGreaterToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4587

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanHashToken()

> **reScanHashToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4597

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanInvalidIdentifier()

> **reScanInvalidIdentifier**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4599

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanJsxAttributeValue()

> **reScanJsxAttributeValue**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4594

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanJsxToken()

> **reScanJsxToken**(`allowMultilineJsxText?`): [`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4595

#### Parameters

##### allowMultilineJsxText?

`boolean`

#### Returns

[`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

***

### reScanLessThanToken()

> **reScanLessThanToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4596

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanQuestionToken()

> **reScanQuestionToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4598

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanSlashToken()

> **reScanSlashToken**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4588

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanTemplateHeadOrNoSubstitutionTemplate()

> **reScanTemplateHeadOrNoSubstitutionTemplate**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4591

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### reScanTemplateToken()

> **reScanTemplateToken**(`isTaggedTemplate`): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4590

#### Parameters

##### isTaggedTemplate

`boolean`

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### scan()

> **scan**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4602

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### scanJsDocToken()

> **scanJsDocToken**(): [`JSDocSyntaxKind`](../type-aliases/JSDocSyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4601

#### Returns

[`JSDocSyntaxKind`](../type-aliases/JSDocSyntaxKind.md)

***

### scanJsxAttributeValue()

> **scanJsxAttributeValue**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4593

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### scanJsxIdentifier()

> **scanJsxIdentifier**(): [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4592

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

***

### scanJsxToken()

> **scanJsxToken**(): [`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4600

#### Returns

[`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

***

### scanRange()

> **scanRange**\<`T`\>(`start`, `length`, `callback`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4610

#### Type Parameters

##### T

`T`

#### Parameters

##### start

`number`

##### length

`number`

##### callback

() => `T`

#### Returns

`T`

***

### setEtsContext()

> **setEtsContext**(`isEtsContext`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4612

#### Parameters

##### isEtsContext

`boolean`

#### Returns

`void`

***

### setLanguageVariant()

> **setLanguageVariant**(`variant`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4607

#### Parameters

##### variant

[`LanguageVariant`](../enumerations/LanguageVariant.md)

#### Returns

`void`

***

### setOnError()

> **setOnError**(`onError`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4605

#### Parameters

##### onError

`undefined` | [`ErrorCallback`](../type-aliases/ErrorCallback.md)

#### Returns

`void`

***

### setScriptTarget()

> **setScriptTarget**(`scriptTarget`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4606

#### Parameters

##### scriptTarget

[`ScriptTarget`](../enumerations/ScriptTarget.md)

#### Returns

`void`

***

### setText()

> **setText**(`text`, `start?`, `length?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4604

#### Parameters

##### text

`undefined` | `string`

##### start?

`number`

##### length?

`number`

#### Returns

`void`

***

### setTextPos()

> **setTextPos**(`textPos`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4608

#### Parameters

##### textPos

`number`

#### Returns

`void`

***

### tryScan()

> **tryScan**\<`T`\>(`callback`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4611

#### Type Parameters

##### T

`T`

#### Parameters

##### callback

() => `T`

#### Returns

`T`
