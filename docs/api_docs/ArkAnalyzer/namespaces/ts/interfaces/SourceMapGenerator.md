[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SourceMapGenerator

# Interface: SourceMapGenerator

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4284

Generates a source map.

## Methods

### addMapping()

#### Call Signature

> **addMapping**(`generatedLine`, `generatedCharacter`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4301

Adds a mapping without source information.

##### Parameters

###### generatedLine

`number`

###### generatedCharacter

`number`

##### Returns

`void`

#### Call Signature

> **addMapping**(`generatedLine`, `generatedCharacter`, `sourceIndex`, `sourceLine`, `sourceCharacter`, `nameIndex?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4305

Adds a mapping with source information.

##### Parameters

###### generatedLine

`number`

###### generatedCharacter

`number`

###### sourceIndex

`number`

###### sourceLine

`number`

###### sourceCharacter

`number`

###### nameIndex?

`number`

##### Returns

`void`

***

### addName()

> **addName**(`name`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4297

Adds a name.

#### Parameters

##### name

`string`

#### Returns

`number`

***

### addSource()

> **addSource**(`fileName`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4289

Adds a source to the source map.

#### Parameters

##### fileName

`string`

#### Returns

`number`

***

### appendSourceMap()

> **appendSourceMap**(`generatedLine`, `generatedCharacter`, `sourceMap`, `sourceMapPath`, `start?`, `end?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4309

Appends a source map.

#### Parameters

##### generatedLine

`number`

##### generatedCharacter

`number`

##### sourceMap

[`RawSourceMap`](RawSourceMap.md)

##### sourceMapPath

`string`

##### start?

[`LineAndCharacter`](LineAndCharacter.md)

##### end?

[`LineAndCharacter`](LineAndCharacter.md)

#### Returns

`void`

***

### getSources()

> **getSources**(): readonly `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4285

#### Returns

readonly `string`[]

***

### setSourceContent()

> **setSourceContent**(`sourceIndex`, `content`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4293

Set the content for a source.

#### Parameters

##### sourceIndex

`number`

##### content

`null` | `string`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): [`RawSourceMap`](RawSourceMap.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4313

Gets the source map as a `RawSourceMap` object.

#### Returns

[`RawSourceMap`](RawSourceMap.md)

***

### toString()

> **toString**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4317

Gets the string representation of the source map.

#### Returns

`string`
