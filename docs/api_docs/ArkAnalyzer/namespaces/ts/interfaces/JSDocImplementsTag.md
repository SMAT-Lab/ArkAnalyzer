[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / JSDocImplementsTag

# Interface: JSDocImplementsTag

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1949

## Extends

- [`JSDocTag`](JSDocTag.md)

## Properties

### class

> `readonly` **class**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1951

#### Type declaration

##### expression

> `readonly` **expression**: [`Identifier`](Identifier.md) \| [`PropertyAccessEntityNameExpression`](PropertyAccessEntityNameExpression.md)

***

### comment?

> `readonly` `optional` **comment**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1914

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`comment`](JSDocTag.md#comment)

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

[`JSDocTag`](JSDocTag.md).[`decorators`](JSDocTag.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`end`](JSDocTag.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`flags`](JSDocTag.md#flags)

***

### kind

> `readonly` **kind**: [`JSDocImplementsTag`](../enumerations/SyntaxKind.md#jsdocimplementstag)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1950

#### Overrides

[`JSDocTag`](JSDocTag.md).[`kind`](JSDocTag.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`locals`](JSDocTag.md#locals)

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

[`JSDocTag`](JSDocTag.md).[`modifiers`](JSDocTag.md#modifiers)

***

### parent

> `readonly` **parent**: [`JSDoc`](JSDoc.md) \| [`JSDocTypeLiteral`](JSDocTypeLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1912

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`parent`](JSDocTag.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`pos`](JSDocTag.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`skipCheck`](JSDocTag.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`symbol`](JSDocTag.md#symbol)

***

### tagName

> `readonly` **tagName**: [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1913

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`tagName`](JSDocTag.md#tagname)

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

[`JSDocTag`](JSDocTag.md).[`forEachChild`](JSDocTag.md#foreachchild)

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

[`JSDocTag`](JSDocTag.md).[`getChildAt`](JSDocTag.md#getchildat)

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

[`JSDocTag`](JSDocTag.md).[`getChildCount`](JSDocTag.md#getchildcount)

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

[`JSDocTag`](JSDocTag.md).[`getChildren`](JSDocTag.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`getEnd`](JSDocTag.md#getend)

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

[`JSDocTag`](JSDocTag.md).[`getFirstToken`](JSDocTag.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`getFullStart`](JSDocTag.md#getfullstart)

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

[`JSDocTag`](JSDocTag.md).[`getFullText`](JSDocTag.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`getFullWidth`](JSDocTag.md#getfullwidth)

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

[`JSDocTag`](JSDocTag.md).[`getLastToken`](JSDocTag.md#getlasttoken)

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

[`JSDocTag`](JSDocTag.md).[`getLeadingTriviaWidth`](JSDocTag.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`JSDocTag`](JSDocTag.md).[`getSourceFile`](JSDocTag.md#getsourcefile)

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

[`JSDocTag`](JSDocTag.md).[`getStart`](JSDocTag.md#getstart)

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

[`JSDocTag`](JSDocTag.md).[`getText`](JSDocTag.md#gettext)

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

[`JSDocTag`](JSDocTag.md).[`getWidth`](JSDocTag.md#getwidth)
