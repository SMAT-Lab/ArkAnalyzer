[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TemplateLiteralLikeNode

# Interface: TemplateLiteralLikeNode

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1223

## Extends

- [`LiteralLikeNode`](LiteralLikeNode.md)

## Extended by

- [`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)
- [`TemplateHead`](TemplateHead.md)
- [`TemplateMiddle`](TemplateMiddle.md)
- [`TemplateTail`](TemplateTail.md)

## Properties

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`decorators`](LiteralLikeNode.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`end`](LiteralLikeNode.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`flags`](LiteralLikeNode.md#flags)

***

### hasExtendedUnicodeEscape?

> `optional` **hasExtendedUnicodeEscape**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1221

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`hasExtendedUnicodeEscape`](LiteralLikeNode.md#hasextendedunicodeescape)

***

### isUnterminated?

> `optional` **isUnterminated**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1220

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`isUnterminated`](LiteralLikeNode.md#isunterminated)

***

### kind

> `readonly` **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:598

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`kind`](LiteralLikeNode.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`locals`](LiteralLikeNode.md#locals)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`modifiers`](LiteralLikeNode.md#modifiers)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`parent`](LiteralLikeNode.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`pos`](LiteralLikeNode.md#pos)

***

### rawText?

> `optional` **rawText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1224

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`skipCheck`](LiteralLikeNode.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`symbol`](LiteralLikeNode.md#symbol)

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1219

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`text`](LiteralLikeNode.md#text)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`forEachChild`](LiteralLikeNode.md#foreachchild)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildAt`](LiteralLikeNode.md#getchildat)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildCount`](LiteralLikeNode.md#getchildcount)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildren`](LiteralLikeNode.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`getEnd`](LiteralLikeNode.md#getend)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFirstToken`](LiteralLikeNode.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullStart`](LiteralLikeNode.md#getfullstart)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullText`](LiteralLikeNode.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullWidth`](LiteralLikeNode.md#getfullwidth)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getLastToken`](LiteralLikeNode.md#getlasttoken)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getLeadingTriviaWidth`](LiteralLikeNode.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`getSourceFile`](LiteralLikeNode.md#getsourcefile)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getStart`](LiteralLikeNode.md#getstart)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getText`](LiteralLikeNode.md#gettext)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getWidth`](LiteralLikeNode.md#getwidth)
