[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / PartiallyEmittedExpression

# Interface: PartiallyEmittedExpression

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1061

## Extends

- [`LeftHandSideExpression`](LeftHandSideExpression.md)

## Properties

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_expressionBrand`](LeftHandSideExpression.md#_expressionbrand)

***

### \_leftHandSideExpressionBrand

> **\_leftHandSideExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1086

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_leftHandSideExpressionBrand`](LeftHandSideExpression.md#_lefthandsideexpressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_unaryExpressionBrand`](LeftHandSideExpression.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_updateExpressionBrand`](LeftHandSideExpression.md#_updateexpressionbrand)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`decorators`](LeftHandSideExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`end`](LeftHandSideExpression.md#end)

***

### expression

> `readonly` **expression**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1063

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`flags`](LeftHandSideExpression.md#flags)

***

### kind

> `readonly` **kind**: [`PartiallyEmittedExpression`](../enumerations/SyntaxKind.md#partiallyemittedexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1062

#### Overrides

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`kind`](LeftHandSideExpression.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`locals`](LeftHandSideExpression.md#locals)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`modifiers`](LeftHandSideExpression.md#modifiers)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`parent`](LeftHandSideExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`pos`](LeftHandSideExpression.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`skipCheck`](LeftHandSideExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`symbol`](LeftHandSideExpression.md#symbol)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`forEachChild`](LeftHandSideExpression.md#foreachchild)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildAt`](LeftHandSideExpression.md#getchildat)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildCount`](LeftHandSideExpression.md#getchildcount)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildren`](LeftHandSideExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getEnd`](LeftHandSideExpression.md#getend)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFirstToken`](LeftHandSideExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullStart`](LeftHandSideExpression.md#getfullstart)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullText`](LeftHandSideExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullWidth`](LeftHandSideExpression.md#getfullwidth)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getLastToken`](LeftHandSideExpression.md#getlasttoken)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getLeadingTriviaWidth`](LeftHandSideExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getSourceFile`](LeftHandSideExpression.md#getsourcefile)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getStart`](LeftHandSideExpression.md#getstart)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getText`](LeftHandSideExpression.md#gettext)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getWidth`](LeftHandSideExpression.md#getwidth)
