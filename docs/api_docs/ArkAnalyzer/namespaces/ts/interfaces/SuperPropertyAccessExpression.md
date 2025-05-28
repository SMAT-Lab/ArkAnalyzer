[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SuperPropertyAccessExpression

# Interface: SuperPropertyAccessExpression

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1314

## Extends

- [`PropertyAccessExpression`](PropertyAccessExpression.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_declarationBrand`](PropertyAccessExpression.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_expressionBrand`](PropertyAccessExpression.md#_expressionbrand)

***

### \_leftHandSideExpressionBrand

> **\_leftHandSideExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1086

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_leftHandSideExpressionBrand`](PropertyAccessExpression.md#_lefthandsideexpressionbrand)

***

### \_memberExpressionBrand

> **\_memberExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1089

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_memberExpressionBrand`](PropertyAccessExpression.md#_memberexpressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_unaryExpressionBrand`](PropertyAccessExpression.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`_updateExpressionBrand`](PropertyAccessExpression.md#_updateexpressionbrand)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`decorators`](PropertyAccessExpression.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`end`](PropertyAccessExpression.md#end)

***

### expression

> `readonly` **expression**: [`SuperExpression`](SuperExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1315

#### Overrides

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`expression`](PropertyAccessExpression.md#expression)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`flags`](PropertyAccessExpression.md#flags)

***

### kind

> `readonly` **kind**: [`PropertyAccessExpression`](../enumerations/SyntaxKind.md#propertyaccessexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1305

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`kind`](PropertyAccessExpression.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`locals`](PropertyAccessExpression.md#locals)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`modifiers`](PropertyAccessExpression.md#modifiers)

***

### name

> `readonly` **name**: [`MemberName`](../type-aliases/MemberName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1308

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`name`](PropertyAccessExpression.md#name)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`parent`](PropertyAccessExpression.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`pos`](PropertyAccessExpression.md#pos)

***

### questionDotToken?

> `readonly` `optional` **questionDotToken**: [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1307

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`questionDotToken`](PropertyAccessExpression.md#questiondottoken)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`skipCheck`](PropertyAccessExpression.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`symbol`](PropertyAccessExpression.md#symbol)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`forEachChild`](PropertyAccessExpression.md#foreachchild)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getChildAt`](PropertyAccessExpression.md#getchildat)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getChildCount`](PropertyAccessExpression.md#getchildcount)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getChildren`](PropertyAccessExpression.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getEnd`](PropertyAccessExpression.md#getend)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getFirstToken`](PropertyAccessExpression.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getFullStart`](PropertyAccessExpression.md#getfullstart)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getFullText`](PropertyAccessExpression.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getFullWidth`](PropertyAccessExpression.md#getfullwidth)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getLastToken`](PropertyAccessExpression.md#getlasttoken)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getLeadingTriviaWidth`](PropertyAccessExpression.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getSourceFile`](PropertyAccessExpression.md#getsourcefile)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getStart`](PropertyAccessExpression.md#getstart)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getText`](PropertyAccessExpression.md#gettext)

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

[`PropertyAccessExpression`](PropertyAccessExpression.md).[`getWidth`](PropertyAccessExpression.md#getwidth)
