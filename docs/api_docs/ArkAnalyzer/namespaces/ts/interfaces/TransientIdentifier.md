[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TransientIdentifier

# Interface: TransientIdentifier

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:686

## Extends

- [`Identifier`](Identifier.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`Identifier`](Identifier.md).[`_declarationBrand`](Identifier.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`Identifier`](Identifier.md).[`_expressionBrand`](Identifier.md#_expressionbrand)

***

### \_leftHandSideExpressionBrand

> **\_leftHandSideExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1086

#### Inherited from

[`Identifier`](Identifier.md).[`_leftHandSideExpressionBrand`](Identifier.md#_lefthandsideexpressionbrand)

***

### \_memberExpressionBrand

> **\_memberExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1089

#### Inherited from

[`Identifier`](Identifier.md).[`_memberExpressionBrand`](Identifier.md#_memberexpressionbrand)

***

### \_primaryExpressionBrand

> **\_primaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1092

#### Inherited from

[`Identifier`](Identifier.md).[`_primaryExpressionBrand`](Identifier.md#_primaryexpressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`Identifier`](Identifier.md).[`_unaryExpressionBrand`](Identifier.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`Identifier`](Identifier.md).[`_updateExpressionBrand`](Identifier.md#_updateexpressionbrand)

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

[`Identifier`](Identifier.md).[`decorators`](Identifier.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`Identifier`](Identifier.md).[`end`](Identifier.md#end)

***

### escapedText

> `readonly` **escapedText**: [`__String`](../type-aliases/String.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:682

Prefer to use `id.unescapedText`. (Note: This is available only in services, not internally to the TypeScript compiler.)
Text of identifier, but if the identifier begins with two underscores, this will begin with three.

#### Inherited from

[`Identifier`](Identifier.md).[`escapedText`](Identifier.md#escapedtext)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`Identifier`](Identifier.md).[`flags`](Identifier.md#flags)

***

### isInJSDocNamespace?

> `optional` **isInJSDocNamespace**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:684

#### Inherited from

[`Identifier`](Identifier.md).[`isInJSDocNamespace`](Identifier.md#isinjsdocnamespace)

***

### kind

> `readonly` **kind**: [`Identifier`](../enumerations/SyntaxKind.md#identifier)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:677

#### Inherited from

[`Identifier`](Identifier.md).[`kind`](Identifier.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`Identifier`](Identifier.md).[`locals`](Identifier.md#locals)

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

[`Identifier`](Identifier.md).[`modifiers`](Identifier.md#modifiers)

***

### originalKeywordKind?

> `readonly` `optional` **originalKeywordKind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:683

#### Inherited from

[`Identifier`](Identifier.md).[`originalKeywordKind`](Identifier.md#originalkeywordkind)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`Identifier`](Identifier.md).[`parent`](Identifier.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`Identifier`](Identifier.md).[`pos`](Identifier.md#pos)

***

### resolvedSymbol

> **resolvedSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:687

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`Identifier`](Identifier.md).[`skipCheck`](Identifier.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`Identifier`](Identifier.md).[`symbol`](Identifier.md#symbol)

***

### text

> `readonly` **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6105

#### Inherited from

[`Identifier`](Identifier.md).[`text`](Identifier.md#text)

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

[`Identifier`](Identifier.md).[`forEachChild`](Identifier.md#foreachchild)

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

[`Identifier`](Identifier.md).[`getChildAt`](Identifier.md#getchildat)

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

[`Identifier`](Identifier.md).[`getChildCount`](Identifier.md#getchildcount)

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

[`Identifier`](Identifier.md).[`getChildren`](Identifier.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`Identifier`](Identifier.md).[`getEnd`](Identifier.md#getend)

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

[`Identifier`](Identifier.md).[`getFirstToken`](Identifier.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`Identifier`](Identifier.md).[`getFullStart`](Identifier.md#getfullstart)

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

[`Identifier`](Identifier.md).[`getFullText`](Identifier.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`Identifier`](Identifier.md).[`getFullWidth`](Identifier.md#getfullwidth)

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

[`Identifier`](Identifier.md).[`getLastToken`](Identifier.md#getlasttoken)

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

[`Identifier`](Identifier.md).[`getLeadingTriviaWidth`](Identifier.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`Identifier`](Identifier.md).[`getSourceFile`](Identifier.md#getsourcefile)

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

[`Identifier`](Identifier.md).[`getStart`](Identifier.md#getstart)

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

[`Identifier`](Identifier.md).[`getText`](Identifier.md#gettext)

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

[`Identifier`](Identifier.md).[`getWidth`](Identifier.md#getwidth)
