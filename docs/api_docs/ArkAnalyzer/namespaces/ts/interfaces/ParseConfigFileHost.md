[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ParseConfigFileHost

# Interface: ParseConfigFileHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5272

Interface extending ParseConfigHost to support ParseConfigFile that reads config file and reports errors

## Extends

- [`ParseConfigHost`](ParseConfigHost.md).[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md)

## Properties

### onUnRecoverableConfigFileDiagnostic

> **onUnRecoverableConfigFileDiagnostic**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5267

Reports unrecoverable error when parsing config file

#### Inherited from

[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md).[`onUnRecoverableConfigFileDiagnostic`](ConfigFileDiagnosticsReporter.md#onunrecoverableconfigfilediagnostic)

***

### useCaseSensitiveFileNames

> **useCaseSensitiveFileNames**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2237

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`useCaseSensitiveFileNames`](ParseConfigHost.md#usecasesensitivefilenames)

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

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`fileExists`](ParseConfigHost.md#fileexists)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5273

#### Returns

`string`

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

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`readDirectory`](ParseConfigHost.md#readdirectory)

***

### readFile()

> **readFile**(`path`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2244

#### Parameters

##### path

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`readFile`](ParseConfigHost.md#readfile)

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2245

#### Parameters

##### s

`string`

#### Returns

`void`

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`trace`](ParseConfigHost.md#trace)
