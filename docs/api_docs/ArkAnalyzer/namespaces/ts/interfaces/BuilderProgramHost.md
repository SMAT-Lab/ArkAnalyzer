[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / BuilderProgramHost

# Interface: BuilderProgramHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5646

## Properties

### createHash()?

> `optional` **createHash**: (`data`) => `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5654

If provided this would be used this hash instead of actual file shape text for detecting changes

#### Parameters

##### data

`string`

#### Returns

`string`

***

### writeFile?

> `optional` **writeFile**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5659

When emit or emitNextAffectedFile are called without writeFile,
this callback if present would be used to write files

## Methods

### useCaseSensitiveFileNames()

> **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5650

return true if file names are treated with case sensitivity

#### Returns

`boolean`
