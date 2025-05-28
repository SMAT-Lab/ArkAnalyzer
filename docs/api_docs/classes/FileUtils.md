[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / FileUtils

# Class: FileUtils

Defined in: src/utils/FileUtils.ts:25

## Constructors

### Constructor

> **new FileUtils**(): `FileUtils`

#### Returns

`FileUtils`

## Properties

### FILE\_FILTER

> `readonly` `static` **FILE\_FILTER**: `object`

Defined in: src/utils/FileUtils.ts:26

#### ignores

> **ignores**: `string`[]

#### include

> **include**: `RegExp`

## Methods

### generateModuleMap()

> `static` **generateModuleMap**(`ohPkgContentMap`): `Map`\<`string`, [`ModulePath`](ModulePath.md)\>

Defined in: src/utils/FileUtils.ts:51

#### Parameters

##### ohPkgContentMap

`Map`\<`string`, \{[`k`: `string`]: `unknown`; \}\>

#### Returns

`Map`\<`string`, [`ModulePath`](ModulePath.md)\>

***

### getFileLanguage()

> `static` **getFileLanguage**(`file`, `fileTags?`): `Language`

Defined in: src/utils/FileUtils.ts:79

#### Parameters

##### file

`string`

##### fileTags?

`Map`\<`string`, `Language`\>

#### Returns

`Language`

***

### getIndexFileName()

> `static` **getIndexFileName**(`srcPath`): `string`

Defined in: src/utils/FileUtils.ts:31

#### Parameters

##### srcPath

`string`

#### Returns

`string`

***

### isAbsolutePath()

> `static` **isAbsolutePath**(`path`): `boolean`

Defined in: src/utils/FileUtils.ts:47

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### isDirectory()

> `static` **isDirectory**(`srcPath`): `boolean`

Defined in: src/utils/FileUtils.ts:40

#### Parameters

##### srcPath

`string`

#### Returns

`boolean`
