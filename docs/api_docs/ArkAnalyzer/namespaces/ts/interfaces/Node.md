[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Node

# Interface: Node

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:597

## Extends

- [`ReadonlyTextRange`](ReadonlyTextRange.md)

## Extended by

- [`Token`](Token.md)
- [`QualifiedName`](QualifiedName.md)
- [`Declaration`](Declaration.md)
- [`ComputedPropertyName`](ComputedPropertyName.md)
- [`Decorator`](Decorator.md)
- [`VariableDeclarationList`](VariableDeclarationList.md)
- [`ObjectBindingPattern`](ObjectBindingPattern.md)
- [`ArrayBindingPattern`](ArrayBindingPattern.md)
- [`TypeNode`](TypeNode.md)
- [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)
- [`Expression`](Expression.md)
- [`LiteralLikeNode`](LiteralLikeNode.md)
- [`TemplateSpan`](TemplateSpan.md)
- [`JsxClosingElement`](JsxClosingElement.md)
- [`Statement`](Statement.md)
- [`CaseBlock`](CaseBlock.md)
- [`CaseClause`](CaseClause.md)
- [`DefaultClause`](DefaultClause.md)
- [`CatchClause`](CatchClause.md)
- [`HeritageClause`](HeritageClause.md)
- [`ModuleBlock`](ModuleBlock.md)
- [`ExternalModuleReference`](ExternalModuleReference.md)
- [`AssertEntry`](AssertEntry.md)
- [`AssertClause`](AssertClause.md)
- [`NamedImports`](NamedImports.md)
- [`NamedExports`](NamedExports.md)
- [`JSDocNameReference`](JSDocNameReference.md)
- [`JSDocMemberName`](JSDocMemberName.md)
- [`JSDoc`](JSDoc.md)
- [`JSDocTag`](JSDocTag.md)
- [`JSDocLink`](JSDocLink.md)
- [`JSDocLinkCode`](JSDocLinkCode.md)
- [`JSDocLinkPlain`](JSDocLinkPlain.md)
- [`JSDocText`](JSDocText.md)
- [`Bundle`](Bundle.md)
- [`InputFiles`](InputFiles.md)
- [`UnparsedSource`](UnparsedSource.md)
- [`UnparsedSection`](UnparsedSection.md)
- [`SyntaxList`](SyntaxList.md)

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

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`ReadonlyTextRange`](ReadonlyTextRange.md).[`end`](ReadonlyTextRange.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

***

### kind

> `readonly` **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:598

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

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

***

### parent

> `readonly` **parent**: `Node`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`ReadonlyTextRange`](ReadonlyTextRange.md).[`pos`](ReadonlyTextRange.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

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

***

### getChildAt()

> **getChildAt**(`index`, `sourceFile?`): `Node`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6090

#### Parameters

##### index

`number`

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`Node`

***

### getChildCount()

> **getChildCount**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6089

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`number`

***

### getChildren()

> **getChildren**(`sourceFile?`): `Node`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6091

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`Node`[]

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

***

### getFirstToken()

> **getFirstToken**(`sourceFile?`): `undefined` \| `Node`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6100

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| `Node`

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

***

### getFullText()

> **getFullText**(`sourceFile?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6098

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`string`

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

***

### getLastToken()

> **getLastToken**(`sourceFile?`): `undefined` \| `Node`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6101

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| `Node`

***

### getLeadingTriviaWidth()

> **getLeadingTriviaWidth**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6097

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`number`

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

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

***

### getText()

> **getText**(`sourceFile?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6099

#### Parameters

##### sourceFile?

[`SourceFile`](SourceFile.md)

#### Returns

`string`

***

### getWidth()

> **getWidth**(`sourceFile?`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6095

#### Parameters

##### sourceFile?

[`SourceFileLike`](SourceFileLike.md)

#### Returns

`number`
