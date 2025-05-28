[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AstTreeUtils

# Class: AstTreeUtils

Defined in: src/utils/AstTreeUtils.ts:22

## Constructors

### Constructor

> **new AstTreeUtils**(): `AstTreeUtils`

#### Returns

`AstTreeUtils`

## Methods

### createSourceFile()

> `static` **createSourceFile**(`fileName`, `code`): [`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

Defined in: src/utils/AstTreeUtils.ts:57

#### Parameters

##### fileName

`string`

##### code

`string`

#### Returns

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

***

### getASTNode()

> `static` **getASTNode**(`fileName`, `code`): [`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

Defined in: src/utils/AstTreeUtils.ts:29

get source file from code segment

#### Parameters

##### fileName

`string`

source file name

##### code

`string`

source code

#### Returns

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

ts.SourceFile

***

### getSourceFileFromArkFile()

> `static` **getSourceFileFromArkFile**(`arkFile`): [`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

Defined in: src/utils/AstTreeUtils.ts:45

get source file from ArkFile

#### Parameters

##### arkFile

[`ArkFile`](ArkFile.md)

ArkFile

#### Returns

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

ts.SourceFile
