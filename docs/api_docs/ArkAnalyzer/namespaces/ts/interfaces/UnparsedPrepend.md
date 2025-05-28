[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / UnparsedPrepend

# Interface: UnparsedPrepend

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2201

## Extends

- [`UnparsedSection`](UnparsedSection.md)

## Properties

### data

> `readonly` **data**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2204

#### Overrides

[`UnparsedSection`](UnparsedSection.md).[`data`](UnparsedSection.md#data)

***

### ~~decorators?~~

> `readonly` `optional` **decorators**: `undefined`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8375

#### Deprecated

`decorators` has been removed from `Node` and merged with `modifiers` on the `Node` subtypes that support them.
Use `ts.canHaveDecorators()` to test whether a `Node` can have decorators.
Use `ts.getDecorators()` to get the decorators of a `Node`.

For example:
```ts
const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
```

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`decorators`](UnparsedSection.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`end`](UnparsedSection.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`flags`](UnparsedSection.md#flags)

***

### kind

> `readonly` **kind**: [`UnparsedPrepend`](../enumerations/SyntaxKind.md#unparsedprepend)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2202

#### Overrides

[`UnparsedSection`](UnparsedSection.md).[`kind`](UnparsedSection.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`locals`](UnparsedSection.md#locals)

***

### ~~modifiers?~~

> `readonly` `optional` **modifiers**: [`NodeArray`](NodeArray.md)\<[`ModifierLike`](../type-aliases/ModifierLike.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8386

#### Deprecated

`modifiers` has been removed from `Node` and moved to the `Node` subtypes that support them.
Use `ts.canHaveModifiers()` to test whether a `Node` can have modifiers.
Use `ts.getModifiers()` to get the modifiers of a `Node`.

For example:
```ts
const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
```

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`modifiers`](UnparsedSection.md#modifiers)

***

### parent

> `readonly` **parent**: [`UnparsedSource`](UnparsedSource.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2203

#### Overrides

[`UnparsedSection`](UnparsedSection.md).[`parent`](UnparsedSection.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`pos`](UnparsedSection.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`skipCheck`](UnparsedSection.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`symbol`](UnparsedSection.md#symbol)

***

### texts

> `readonly` **texts**: readonly [`UnparsedTextLike`](UnparsedTextLike.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2205

## Methods

### forEachChild()

> **forEachChild**\<`T`\>(`cbNode`, `cbNodeArray?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6102

#### Type Parameters

##### T

`T`

#### Parameters

##### cbNode

(`node`) => `undefined` \| `T`

##### cbNodeArray?

(`nodes`) => `undefined` \| `T`

#### Returns

`undefined` \| `T`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`forEachChild`](UnparsedSection.md#foreachchild)

***

### getChildAt()

> **getChildAt**(`index`, `sourceFile?`): [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6090

#### Parameters

##### index

`number`

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

[`Node`](Node.md)

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getChildAt`](UnparsedSection.md#getchildat)

***

### getChildCount()

> **getChildCount**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6089

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getChildCount`](UnparsedSection.md#getchildcount)

***

### getChildren()

> **getChildren**(`sourceFile?`): [`Node`](Node.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6091

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

[`Node`](Node.md)[]

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getChildren`](UnparsedSection.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getEnd`](UnparsedSection.md#getend)

***

### getFirstToken()

> **getFirstToken**(`sourceFile?`): `undefined` \| [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6100

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getFirstToken`](UnparsedSection.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getFullStart`](UnparsedSection.md#getfullstart)

***

### getFullText()

> **getFullText**(`sourceFile?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6098

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getFullText`](UnparsedSection.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getFullWidth`](UnparsedSection.md#getfullwidth)

***

### getLastToken()

> **getLastToken**(`sourceFile?`): `undefined` \| [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6101

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getLastToken`](UnparsedSection.md#getlasttoken)

***

### getLeadingTriviaWidth()

> **getLeadingTriviaWidth**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6097

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getLeadingTriviaWidth`](UnparsedSection.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getSourceFile`](UnparsedSection.md#getsourcefile)

***

### getStart()

> **getStart**(`sourceFile?`, `includeJsDocComment?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6092

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

##### includeJsDocComment?

`boolean`

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getStart`](UnparsedSection.md#getstart)

***

### getText()

> **getText**(`sourceFile?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6099

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getText`](UnparsedSection.md#gettext)

***

### getWidth()

> **getWidth**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6095

#### Parameters

##### sourceFile?

[`SourceFileLike`](SourceFileLike.md)

#### Returns

`number`

#### Inherited from

[`UnparsedSection`](UnparsedSection.md).[`getWidth`](UnparsedSection.md#getwidth)
