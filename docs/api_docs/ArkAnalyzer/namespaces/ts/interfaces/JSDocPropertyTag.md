[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / JSDocPropertyTag

# Interface: JSDocPropertyTag

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2033

## Extends

- [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`_declarationBrand`](JSDocPropertyLikeTag.md#_declarationbrand)

***

### comment?

> `readonly` `optional` **comment**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1914

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`comment`](JSDocPropertyLikeTag.md#comment)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`decorators`](JSDocPropertyLikeTag.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`end`](JSDocPropertyLikeTag.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`flags`](JSDocPropertyLikeTag.md#flags)

***

### isBracketed

> `readonly` **isBracketed**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2031

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`isBracketed`](JSDocPropertyLikeTag.md#isbracketed)

***

### isNameFirst

> `readonly` **isNameFirst**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2030

Whether the property name came before the type -- non-standard for JSDoc, but Typescript-like

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`isNameFirst`](JSDocPropertyLikeTag.md#isnamefirst)

***

### kind

> `readonly` **kind**: [`JSDocPropertyTag`](../enumerations/SyntaxKind.md#jsdocpropertytag)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2034

#### Overrides

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`kind`](JSDocPropertyLikeTag.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`locals`](JSDocPropertyLikeTag.md#locals)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`modifiers`](JSDocPropertyLikeTag.md#modifiers)

***

### name

> `readonly` **name**: [`EntityName`](../type-aliases/EntityName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2027

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`name`](JSDocPropertyLikeTag.md#name)

***

### parent

> `readonly` **parent**: [`JSDoc`](JSDoc.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2026

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`parent`](JSDocPropertyLikeTag.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`pos`](JSDocPropertyLikeTag.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`skipCheck`](JSDocPropertyLikeTag.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`symbol`](JSDocPropertyLikeTag.md#symbol)

***

### tagName

> `readonly` **tagName**: [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1913

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`tagName`](JSDocPropertyLikeTag.md#tagname)

***

### typeExpression?

> `readonly` `optional` **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2028

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`typeExpression`](JSDocPropertyLikeTag.md#typeexpression)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`forEachChild`](JSDocPropertyLikeTag.md#foreachchild)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildAt`](JSDocPropertyLikeTag.md#getchildat)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildCount`](JSDocPropertyLikeTag.md#getchildcount)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildren`](JSDocPropertyLikeTag.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getEnd`](JSDocPropertyLikeTag.md#getend)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFirstToken`](JSDocPropertyLikeTag.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullStart`](JSDocPropertyLikeTag.md#getfullstart)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullText`](JSDocPropertyLikeTag.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullWidth`](JSDocPropertyLikeTag.md#getfullwidth)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getLastToken`](JSDocPropertyLikeTag.md#getlasttoken)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getLeadingTriviaWidth`](JSDocPropertyLikeTag.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getSourceFile`](JSDocPropertyLikeTag.md#getsourcefile)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getStart`](JSDocPropertyLikeTag.md#getstart)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getText`](JSDocPropertyLikeTag.md#gettext)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getWidth`](JSDocPropertyLikeTag.md#getwidth)
