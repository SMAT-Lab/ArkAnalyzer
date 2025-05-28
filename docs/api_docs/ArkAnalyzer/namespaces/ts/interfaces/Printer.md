[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Printer

# Interface: Printer

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4186

## Methods

### printBundle()

> **printBundle**(`bundle`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4212

Prints a bundle of source files as-is, without any emit transformations.

#### Parameters

##### bundle

[`Bundle`](Bundle.md)

#### Returns

`string`

***

### printFile()

> **printFile**(`sourceFile`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4208

Prints a source file as-is, without any emit transformations.

#### Parameters

##### sourceFile

[`SourceFile`](SourceFile.md)

#### Returns

`string`

***

### printList()

> **printList**\<`T`\>(`format`, `list`, `sourceFile`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4204

Prints a list of nodes using the given format flags

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### format

[`ListFormat`](../enumerations/ListFormat.md)

##### list

[`NodeArray`](NodeArray.md)\<`T`\>

##### sourceFile

[`SourceFile`](SourceFile.md)

#### Returns

`string`

***

### printNode()

> **printNode**(`hint`, `node`, `sourceFile`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4200

Print a node and its subtree as-is, without any emit transformations.

#### Parameters

##### hint

[`EmitHint`](../enumerations/EmitHint.md)

A value indicating the purpose of a node. This is primarily used to
distinguish between an `Identifier` used in an expression position, versus an
`Identifier` used as an `IdentifierName` as part of a declaration. For most nodes you
should just pass `Unspecified`.

##### node

[`Node`](Node.md)

The node to print. The node and its subtree are printed as-is, without any
emit transformations.

##### sourceFile

[`SourceFile`](SourceFile.md)

A source file that provides context for the node. The source text of
the file is used to emit the original source content for literals and identifiers, while
the identifiers of the source file are used when generating unique names to avoid
collisions.

#### Returns

`string`

***

### writeFile()

> **writeFile**(`sourceFile`, `writer`, `sourceMapGenerator`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4213

#### Parameters

##### sourceFile

[`SourceFile`](SourceFile.md)

##### writer

[`EmitTextWriter`](EmitTextWriter.md)

##### sourceMapGenerator

`undefined` | [`SourceMapGenerator`](SourceMapGenerator.md)

#### Returns

`void`
