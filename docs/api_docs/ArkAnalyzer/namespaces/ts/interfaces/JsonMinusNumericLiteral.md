[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / JsonMinusNumericLiteral

# Interface: JsonMinusNumericLiteral

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2221

## Extends

- [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

## Properties

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_expressionBrand`](PrefixUnaryExpression.md#_expressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_unaryExpressionBrand`](PrefixUnaryExpression.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_updateExpressionBrand`](PrefixUnaryExpression.md#_updateexpressionbrand)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`decorators`](PrefixUnaryExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`end`](PrefixUnaryExpression.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`flags`](PrefixUnaryExpression.md#flags)

***

### kind

> `readonly` **kind**: [`PrefixUnaryExpression`](../enumerations/SyntaxKind.md#prefixunaryexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2222

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`kind`](PrefixUnaryExpression.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`locals`](PrefixUnaryExpression.md#locals)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`modifiers`](PrefixUnaryExpression.md#modifiers)

***

### operand

> `readonly` **operand**: [`NumericLiteral`](NumericLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2224

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`operand`](PrefixUnaryExpression.md#operand)

***

### operator

> `readonly` **operator**: [`MinusToken`](../enumerations/SyntaxKind.md#minustoken)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2223

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`operator`](PrefixUnaryExpression.md#operator)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`parent`](PrefixUnaryExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`pos`](PrefixUnaryExpression.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`skipCheck`](PrefixUnaryExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`symbol`](PrefixUnaryExpression.md#symbol)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`forEachChild`](PrefixUnaryExpression.md#foreachchild)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildAt`](PrefixUnaryExpression.md#getchildat)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildCount`](PrefixUnaryExpression.md#getchildcount)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildren`](PrefixUnaryExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getEnd`](PrefixUnaryExpression.md#getend)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFirstToken`](PrefixUnaryExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullStart`](PrefixUnaryExpression.md#getfullstart)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullText`](PrefixUnaryExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullWidth`](PrefixUnaryExpression.md#getfullwidth)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getLastToken`](PrefixUnaryExpression.md#getlasttoken)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getLeadingTriviaWidth`](PrefixUnaryExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getSourceFile`](PrefixUnaryExpression.md#getsourcefile)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getStart`](PrefixUnaryExpression.md#getstart)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getText`](PrefixUnaryExpression.md#gettext)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getWidth`](PrefixUnaryExpression.md#getwidth)
