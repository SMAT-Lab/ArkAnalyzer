[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / PostfixUnaryExpression

# Interface: PostfixUnaryExpression

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1080

## Extends

- [`UpdateExpression`](UpdateExpression.md)

## Properties

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`_expressionBrand`](UpdateExpression.md#_expressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`_unaryExpressionBrand`](UpdateExpression.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`_updateExpressionBrand`](UpdateExpression.md#_updateexpressionbrand)

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

[`UpdateExpression`](UpdateExpression.md).[`decorators`](UpdateExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`end`](UpdateExpression.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`flags`](UpdateExpression.md#flags)

***

### kind

> `readonly` **kind**: [`PostfixUnaryExpression`](../enumerations/SyntaxKind.md#postfixunaryexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1081

#### Overrides

[`UpdateExpression`](UpdateExpression.md).[`kind`](UpdateExpression.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`locals`](UpdateExpression.md#locals)

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

[`UpdateExpression`](UpdateExpression.md).[`modifiers`](UpdateExpression.md#modifiers)

***

### operand

> `readonly` **operand**: [`LeftHandSideExpression`](LeftHandSideExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1082

***

### operator

> `readonly` **operator**: [`PostfixUnaryOperator`](../type-aliases/PostfixUnaryOperator.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1083

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`parent`](UpdateExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`pos`](UpdateExpression.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`skipCheck`](UpdateExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`symbol`](UpdateExpression.md#symbol)

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

[`UpdateExpression`](UpdateExpression.md).[`forEachChild`](UpdateExpression.md#foreachchild)

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

[`UpdateExpression`](UpdateExpression.md).[`getChildAt`](UpdateExpression.md#getchildat)

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

[`UpdateExpression`](UpdateExpression.md).[`getChildCount`](UpdateExpression.md#getchildcount)

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

[`UpdateExpression`](UpdateExpression.md).[`getChildren`](UpdateExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`getEnd`](UpdateExpression.md#getend)

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

[`UpdateExpression`](UpdateExpression.md).[`getFirstToken`](UpdateExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`getFullStart`](UpdateExpression.md#getfullstart)

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

[`UpdateExpression`](UpdateExpression.md).[`getFullText`](UpdateExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`getFullWidth`](UpdateExpression.md#getfullwidth)

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

[`UpdateExpression`](UpdateExpression.md).[`getLastToken`](UpdateExpression.md#getlasttoken)

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

[`UpdateExpression`](UpdateExpression.md).[`getLeadingTriviaWidth`](UpdateExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`UpdateExpression`](UpdateExpression.md).[`getSourceFile`](UpdateExpression.md#getsourcefile)

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

[`UpdateExpression`](UpdateExpression.md).[`getStart`](UpdateExpression.md#getstart)

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

[`UpdateExpression`](UpdateExpression.md).[`getText`](UpdateExpression.md#gettext)

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

[`UpdateExpression`](UpdateExpression.md).[`getWidth`](UpdateExpression.md#getwidth)
