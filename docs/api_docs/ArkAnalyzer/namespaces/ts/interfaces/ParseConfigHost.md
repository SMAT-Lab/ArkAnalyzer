[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ParseConfigHost

# Interface: ParseConfigHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2236

## Extended by

- [`ParseConfigFileHost`](ParseConfigFileHost.md)

## Properties

### useCaseSensitiveFileNames

> **useCaseSensitiveFileNames**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2237

## Methods

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2243

Gets a value indicating whether the specified path exists and is a file.

#### Parameters

##### path

`string`

The path to test.

#### Returns

`boolean`

***

### readDirectory()

> **readDirectory**(`rootDir`, `extensions`, `excludes`, `includes`, `depth?`): readonly `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2238

#### Parameters

##### rootDir

`string`

##### extensions

readonly `string`[]

##### excludes

`undefined` | readonly `string`[]

##### includes

readonly `string`[]

##### depth?

`number`

#### Returns

readonly `string`[]

***

### readFile()

> **readFile**(`path`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2244

#### Parameters

##### path

`string`

#### Returns

`undefined` \| `string`

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2245

#### Parameters

##### s

`string`

#### Returns

`void`
