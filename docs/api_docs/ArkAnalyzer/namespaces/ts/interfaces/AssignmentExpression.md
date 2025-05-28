[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / AssignmentExpression

# Interface: AssignmentExpression\<TOperator\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1168

## Extends

- [`BinaryExpression`](BinaryExpression.md)

## Extended by

- [`ObjectDestructuringAssignment`](ObjectDestructuringAssignment.md)
- [`ArrayDestructuringAssignment`](ArrayDestructuringAssignment.md)

## Type Parameters

### TOperator

`TOperator` *extends* [`AssignmentOperatorToken`](../type-aliases/AssignmentOperatorToken.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`_declarationBrand`](BinaryExpression.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`_expressionBrand`](BinaryExpression.md#_expressionbrand)

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

[`BinaryExpression`](BinaryExpression.md).[`decorators`](BinaryExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`end`](BinaryExpression.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`flags`](BinaryExpression.md#flags)

***

### kind

> `readonly` **kind**: [`BinaryExpression`](../enumerations/SyntaxKind.md#binaryexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1162

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`kind`](BinaryExpression.md#kind)

***

### left

> `readonly` **left**: [`LeftHandSideExpression`](LeftHandSideExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1169

#### Overrides

[`BinaryExpression`](BinaryExpression.md).[`left`](BinaryExpression.md#left)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`locals`](BinaryExpression.md#locals)

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

[`BinaryExpression`](BinaryExpression.md).[`modifiers`](BinaryExpression.md#modifiers)

***

### operatorToken

> `readonly` **operatorToken**: `TOperator`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1170

#### Overrides

[`BinaryExpression`](BinaryExpression.md).[`operatorToken`](BinaryExpression.md#operatortoken)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`parent`](BinaryExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`pos`](BinaryExpression.md#pos)

***

### right

> `readonly` **right**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1165

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`right`](BinaryExpression.md#right)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`skipCheck`](BinaryExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`symbol`](BinaryExpression.md#symbol)

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

[`BinaryExpression`](BinaryExpression.md).[`forEachChild`](BinaryExpression.md#foreachchild)

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

[`BinaryExpression`](BinaryExpression.md).[`getChildAt`](BinaryExpression.md#getchildat)

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

[`BinaryExpression`](BinaryExpression.md).[`getChildCount`](BinaryExpression.md#getchildcount)

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

[`BinaryExpression`](BinaryExpression.md).[`getChildren`](BinaryExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`getEnd`](BinaryExpression.md#getend)

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

[`BinaryExpression`](BinaryExpression.md).[`getFirstToken`](BinaryExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`getFullStart`](BinaryExpression.md#getfullstart)

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

[`BinaryExpression`](BinaryExpression.md).[`getFullText`](BinaryExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`getFullWidth`](BinaryExpression.md#getfullwidth)

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

[`BinaryExpression`](BinaryExpression.md).[`getLastToken`](BinaryExpression.md#getlasttoken)

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

[`BinaryExpression`](BinaryExpression.md).[`getLeadingTriviaWidth`](BinaryExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`BinaryExpression`](BinaryExpression.md).[`getSourceFile`](BinaryExpression.md#getsourcefile)

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

[`BinaryExpression`](BinaryExpression.md).[`getStart`](BinaryExpression.md#getstart)

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

[`BinaryExpression`](BinaryExpression.md).[`getText`](BinaryExpression.md#gettext)

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

[`BinaryExpression`](BinaryExpression.md).[`getWidth`](BinaryExpression.md#getwidth)
