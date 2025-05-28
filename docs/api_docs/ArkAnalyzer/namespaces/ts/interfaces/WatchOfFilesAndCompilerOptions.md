[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / WatchOfFilesAndCompilerOptions

# Interface: WatchOfFilesAndCompilerOptions\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5902

Creates the watch that generates program using the root files and compiler options

## Extends

- [`Watch`](Watch.md)\<`T`\>

## Type Parameters

### T

`T`

## Methods

### close()

> **close**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5892

Closes the watch

#### Returns

`void`

#### Inherited from

[`Watch`](Watch.md).[`close`](Watch.md#close)

***

### getProgram()

> **getProgram**(): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5890

Synchronize with host and get updated program

#### Returns

`T`

#### Inherited from

[`Watch`](Watch.md).[`getProgram`](Watch.md#getprogram)

***

### updateRootFileNames()

> **updateRootFileNames**(`fileNames`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5904

Updates the root files in the program, only if this is not config file compilation

#### Parameters

##### fileNames

`string`[]

#### Returns

`void`
