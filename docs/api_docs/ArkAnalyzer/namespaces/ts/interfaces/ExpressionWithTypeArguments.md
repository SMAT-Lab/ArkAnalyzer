[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ExpressionWithTypeArguments

# Interface: ExpressionWithTypeArguments

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1353

## Extends

- [`MemberExpression`](MemberExpression.md).[`NodeWithTypeArguments`](NodeWithTypeArguments.md)

## Properties

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`MemberExpression`](MemberExpression.md).[`_expressionBrand`](MemberExpression.md#_expressionbrand)

***

### \_leftHandSideExpressionBrand

> **\_leftHandSideExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1086

#### Inherited from

[`MemberExpression`](MemberExpression.md).[`_leftHandSideExpressionBrand`](MemberExpression.md#_lefthandsideexpressionbrand)

***

### \_memberExpressionBrand

> **\_memberExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1089

#### Inherited from

[`MemberExpression`](MemberExpression.md).[`_memberExpressionBrand`](MemberExpression.md#_memberexpressionbrand)

***

### \_typeNodeBrand

> **\_typeNodeBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:912

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`_typeNodeBrand`](NodeWithTypeArguments.md#_typenodebrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`MemberExpression`](MemberExpression.md).[`_unaryExpressionBrand`](MemberExpression.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`MemberExpression`](MemberExpression.md).[`_updateExpressionBrand`](MemberExpression.md#_updateexpressionbrand)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`decorators`](NodeWithTypeArguments.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`end`](NodeWithTypeArguments.md#end)

***

### expression

> `readonly` **expression**: [`LeftHandSideExpression`](LeftHandSideExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1355

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`flags`](NodeWithTypeArguments.md#flags)

***

### kind

> `readonly` **kind**: [`ExpressionWithTypeArguments`](../enumerations/SyntaxKind.md#expressionwithtypearguments)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1354

#### Overrides

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`kind`](NodeWithTypeArguments.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`locals`](NodeWithTypeArguments.md#locals)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`modifiers`](NodeWithTypeArguments.md#modifiers)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`parent`](NodeWithTypeArguments.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`pos`](NodeWithTypeArguments.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`skipCheck`](NodeWithTypeArguments.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`symbol`](NodeWithTypeArguments.md#symbol)

***

### typeArguments?

> `readonly` `optional` **typeArguments**: [`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:946

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`typeArguments`](NodeWithTypeArguments.md#typearguments)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`forEachChild`](NodeWithTypeArguments.md#foreachchild)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getChildAt`](NodeWithTypeArguments.md#getchildat)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getChildCount`](NodeWithTypeArguments.md#getchildcount)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getChildren`](NodeWithTypeArguments.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getEnd`](NodeWithTypeArguments.md#getend)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getFirstToken`](NodeWithTypeArguments.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getFullStart`](NodeWithTypeArguments.md#getfullstart)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getFullText`](NodeWithTypeArguments.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getFullWidth`](NodeWithTypeArguments.md#getfullwidth)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getLastToken`](NodeWithTypeArguments.md#getlasttoken)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getLeadingTriviaWidth`](NodeWithTypeArguments.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getSourceFile`](NodeWithTypeArguments.md#getsourcefile)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getStart`](NodeWithTypeArguments.md#getstart)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getText`](NodeWithTypeArguments.md#gettext)

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

[`NodeWithTypeArguments`](NodeWithTypeArguments.md).[`getWidth`](NodeWithTypeArguments.md#getwidth)
