[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ArrayDestructuringAssignment

# Interface: ArrayDestructuringAssignment

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1175

## Extends

- [`AssignmentExpression`](AssignmentExpression.md)\<[`EqualsToken`](../type-aliases/EqualsToken.md)\>

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`_declarationBrand`](AssignmentExpression.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`_expressionBrand`](AssignmentExpression.md#_expressionbrand)

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

[`AssignmentExpression`](AssignmentExpression.md).[`decorators`](AssignmentExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`end`](AssignmentExpression.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`flags`](AssignmentExpression.md#flags)

***

### kind

> `readonly` **kind**: [`BinaryExpression`](../enumerations/SyntaxKind.md#binaryexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1162

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`kind`](AssignmentExpression.md#kind)

***

### left

> `readonly` **left**: [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1176

#### Overrides

[`AssignmentExpression`](AssignmentExpression.md).[`left`](AssignmentExpression.md#left)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`locals`](AssignmentExpression.md#locals)

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

[`AssignmentExpression`](AssignmentExpression.md).[`modifiers`](AssignmentExpression.md#modifiers)

***

### operatorToken

> `readonly` **operatorToken**: [`EqualsToken`](../type-aliases/EqualsToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1170

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`operatorToken`](AssignmentExpression.md#operatortoken)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`parent`](AssignmentExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`pos`](AssignmentExpression.md#pos)

***

### right

> `readonly` **right**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1165

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`right`](AssignmentExpression.md#right)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`skipCheck`](AssignmentExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`symbol`](AssignmentExpression.md#symbol)

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

[`AssignmentExpression`](AssignmentExpression.md).[`forEachChild`](AssignmentExpression.md#foreachchild)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getChildAt`](AssignmentExpression.md#getchildat)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getChildCount`](AssignmentExpression.md#getchildcount)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getChildren`](AssignmentExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`getEnd`](AssignmentExpression.md#getend)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getFirstToken`](AssignmentExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`getFullStart`](AssignmentExpression.md#getfullstart)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getFullText`](AssignmentExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`getFullWidth`](AssignmentExpression.md#getfullwidth)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getLastToken`](AssignmentExpression.md#getlasttoken)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getLeadingTriviaWidth`](AssignmentExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`AssignmentExpression`](AssignmentExpression.md).[`getSourceFile`](AssignmentExpression.md#getsourcefile)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getStart`](AssignmentExpression.md#getstart)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getText`](AssignmentExpression.md#gettext)

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

[`AssignmentExpression`](AssignmentExpression.md).[`getWidth`](AssignmentExpression.md#getwidth)
