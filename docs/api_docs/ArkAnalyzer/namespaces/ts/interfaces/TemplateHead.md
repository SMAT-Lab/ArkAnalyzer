[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TemplateHead

# Interface: TemplateHead

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1250

## Extends

- [`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`decorators`](TemplateLiteralLikeNode.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`end`](TemplateLiteralLikeNode.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`flags`](TemplateLiteralLikeNode.md#flags)

***

### hasExtendedUnicodeEscape?

> `optional` **hasExtendedUnicodeEscape**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1221

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`hasExtendedUnicodeEscape`](TemplateLiteralLikeNode.md#hasextendedunicodeescape)

***

### isUnterminated?

> `optional` **isUnterminated**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1220

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`isUnterminated`](TemplateLiteralLikeNode.md#isunterminated)

***

### kind

> `readonly` **kind**: [`TemplateHead`](../enumerations/SyntaxKind.md#templatehead)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1251

#### Overrides

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`kind`](TemplateLiteralLikeNode.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`locals`](TemplateLiteralLikeNode.md#locals)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`modifiers`](TemplateLiteralLikeNode.md#modifiers)

***

### parent

> `readonly` **parent**: [`TemplateExpression`](TemplateExpression.md) \| [`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1252

#### Overrides

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`parent`](TemplateLiteralLikeNode.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`pos`](TemplateLiteralLikeNode.md#pos)

***

### rawText?

> `optional` **rawText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1224

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`rawText`](TemplateLiteralLikeNode.md#rawtext)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`skipCheck`](TemplateLiteralLikeNode.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`symbol`](TemplateLiteralLikeNode.md#symbol)

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1219

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`text`](TemplateLiteralLikeNode.md#text)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`forEachChild`](TemplateLiteralLikeNode.md#foreachchild)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildAt`](TemplateLiteralLikeNode.md#getchildat)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildCount`](TemplateLiteralLikeNode.md#getchildcount)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildren`](TemplateLiteralLikeNode.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getEnd`](TemplateLiteralLikeNode.md#getend)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFirstToken`](TemplateLiteralLikeNode.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullStart`](TemplateLiteralLikeNode.md#getfullstart)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullText`](TemplateLiteralLikeNode.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullWidth`](TemplateLiteralLikeNode.md#getfullwidth)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getLastToken`](TemplateLiteralLikeNode.md#getlasttoken)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getLeadingTriviaWidth`](TemplateLiteralLikeNode.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getSourceFile`](TemplateLiteralLikeNode.md#getsourcefile)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getStart`](TemplateLiteralLikeNode.md#getstart)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getText`](TemplateLiteralLikeNode.md#gettext)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getWidth`](TemplateLiteralLikeNode.md#getwidth)
