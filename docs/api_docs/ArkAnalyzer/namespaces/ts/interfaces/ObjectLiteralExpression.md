[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ObjectLiteralExpression

# Interface: ObjectLiteralExpression

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1298

This interface is a base interface for ObjectLiteralExpression and JSXAttributes to extend from. JSXAttributes is similar to
ObjectLiteralExpression in that it contains array of properties; however, JSXAttributes' properties can only be
JSXAttribute or JSXSpreadAttribute. ObjectLiteralExpression, on the other hand, can only have properties of type
ObjectLiteralElement (e.g. PropertyAssignment, ShorthandPropertyAssignment etc.)

## Extends

- [`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md)\<[`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)\>

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_declarationBrand`](ObjectLiteralExpressionBase.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_expressionBrand`](ObjectLiteralExpressionBase.md#_expressionbrand)

***

### \_leftHandSideExpressionBrand

> **\_leftHandSideExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1086

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_leftHandSideExpressionBrand`](ObjectLiteralExpressionBase.md#_lefthandsideexpressionbrand)

***

### \_memberExpressionBrand

> **\_memberExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1089

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_memberExpressionBrand`](ObjectLiteralExpressionBase.md#_memberexpressionbrand)

***

### \_primaryExpressionBrand

> **\_primaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1092

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_primaryExpressionBrand`](ObjectLiteralExpressionBase.md#_primaryexpressionbrand)

***

### \_unaryExpressionBrand

> **\_unaryExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1066

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_unaryExpressionBrand`](ObjectLiteralExpressionBase.md#_unaryexpressionbrand)

***

### \_updateExpressionBrand

> **\_updateExpressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1071

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`_updateExpressionBrand`](ObjectLiteralExpressionBase.md#_updateexpressionbrand)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`decorators`](ObjectLiteralExpressionBase.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`end`](ObjectLiteralExpressionBase.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`flags`](ObjectLiteralExpressionBase.md#flags)

***

### kind

> `readonly` **kind**: [`ObjectLiteralExpression`](../enumerations/SyntaxKind.md#objectliteralexpression)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1299

#### Overrides

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`kind`](ObjectLiteralExpressionBase.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`locals`](ObjectLiteralExpressionBase.md#locals)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`modifiers`](ObjectLiteralExpressionBase.md#modifiers)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`parent`](ObjectLiteralExpressionBase.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`pos`](ObjectLiteralExpressionBase.md#pos)

***

### properties

> `readonly` **properties**: [`NodeArray`](NodeArray.md)\<[`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1296

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`properties`](ObjectLiteralExpressionBase.md#properties)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`skipCheck`](ObjectLiteralExpressionBase.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`symbol`](ObjectLiteralExpressionBase.md#symbol)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`forEachChild`](ObjectLiteralExpressionBase.md#foreachchild)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getChildAt`](ObjectLiteralExpressionBase.md#getchildat)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getChildCount`](ObjectLiteralExpressionBase.md#getchildcount)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getChildren`](ObjectLiteralExpressionBase.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getEnd`](ObjectLiteralExpressionBase.md#getend)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getFirstToken`](ObjectLiteralExpressionBase.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getFullStart`](ObjectLiteralExpressionBase.md#getfullstart)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getFullText`](ObjectLiteralExpressionBase.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getFullWidth`](ObjectLiteralExpressionBase.md#getfullwidth)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getLastToken`](ObjectLiteralExpressionBase.md#getlasttoken)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getLeadingTriviaWidth`](ObjectLiteralExpressionBase.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getSourceFile`](ObjectLiteralExpressionBase.md#getsourcefile)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getStart`](ObjectLiteralExpressionBase.md#getstart)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getText`](ObjectLiteralExpressionBase.md#gettext)

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

[`ObjectLiteralExpressionBase`](ObjectLiteralExpressionBase.md).[`getWidth`](ObjectLiteralExpressionBase.md#getwidth)
