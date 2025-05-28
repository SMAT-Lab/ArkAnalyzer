[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ArrowFunction

# Interface: ArrowFunction

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1211

Several node kinds share function-like features such as a signature,
a name, and a body. These nodes should extend FunctionLikeDeclarationBase.
Examples:
- FunctionDeclaration
- MethodDeclaration
- AccessorDeclaration

## Extends

- [`Expression`](Expression.md).[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`JSDocContainer`](JSDocContainer.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`_declarationBrand`](FunctionLikeDeclarationBase.md#_declarationbrand)

***

### \_expressionBrand

> **\_expressionBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1056

#### Inherited from

[`Expression`](Expression.md).[`_expressionBrand`](Expression.md#_expressionbrand)

***

### \_functionLikeDeclarationBrand

> **\_functionLikeDeclarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:846

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`_functionLikeDeclarationBrand`](FunctionLikeDeclarationBase.md#_functionlikedeclarationbrand)

***

### asteriskToken?

> `readonly` `optional` **asteriskToken**: [`AsteriskToken`](../type-aliases/AsteriskToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:847

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`asteriskToken`](FunctionLikeDeclarationBase.md#asterisktoken)

***

### body

> `readonly` **body**: [`ConciseBody`](../type-aliases/ConciseBody.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1215

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`body`](FunctionLikeDeclarationBase.md#body)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`decorators`](FunctionLikeDeclarationBase.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`end`](FunctionLikeDeclarationBase.md#end)

***

### equalsGreaterThanToken

> `readonly` **equalsGreaterThanToken**: [`EqualsGreaterThanToken`](../type-aliases/EqualsGreaterThanToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1214

***

### exclamationToken?

> `readonly` `optional` **exclamationToken**: [`ExclamationToken`](../type-aliases/ExclamationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:849

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`exclamationToken`](FunctionLikeDeclarationBase.md#exclamationtoken)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`flags`](FunctionLikeDeclarationBase.md#flags)

***

### kind

> `readonly` **kind**: [`ArrowFunction`](../enumerations/SyntaxKind.md#arrowfunction)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1212

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`kind`](FunctionLikeDeclarationBase.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`locals`](FunctionLikeDeclarationBase.md#locals)

***

### ~~modifiers?~~

> `readonly` `optional` **modifiers**: [`NodeArray`](NodeArray.md)\<[`Modifier`](../type-aliases/Modifier.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1213

#### Deprecated

`modifiers` has been removed from `Node` and moved to the `Node` subtypes that support them.
Use `ts.canHaveModifiers()` to test whether a `Node` can have modifiers.
Use `ts.getModifiers()` to get the modifiers of a `Node`.

For example:
```ts
const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
```

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`modifiers`](FunctionLikeDeclarationBase.md#modifiers)

***

### name

> `readonly` **name**: `never`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1216

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`name`](FunctionLikeDeclarationBase.md#name)

***

### parameters

> `readonly` **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:735

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`parameters`](FunctionLikeDeclarationBase.md#parameters)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`parent`](FunctionLikeDeclarationBase.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`pos`](FunctionLikeDeclarationBase.md#pos)

***

### questionToken?

> `readonly` `optional` **questionToken**: [`QuestionToken`](../type-aliases/QuestionToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:848

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`questionToken`](FunctionLikeDeclarationBase.md#questiontoken)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`skipCheck`](FunctionLikeDeclarationBase.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`symbol`](FunctionLikeDeclarationBase.md#symbol)

***

### type?

> `readonly` `optional` **type**: [`TypeNode`](TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:736

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`type`](FunctionLikeDeclarationBase.md#type)

***

### typeParameters?

> `readonly` `optional` **typeParameters**: [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:734

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`typeParameters`](FunctionLikeDeclarationBase.md#typeparameters)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`forEachChild`](FunctionLikeDeclarationBase.md#foreachchild)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getChildAt`](FunctionLikeDeclarationBase.md#getchildat)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getChildCount`](FunctionLikeDeclarationBase.md#getchildcount)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getChildren`](FunctionLikeDeclarationBase.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getEnd`](FunctionLikeDeclarationBase.md#getend)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getFirstToken`](FunctionLikeDeclarationBase.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getFullStart`](FunctionLikeDeclarationBase.md#getfullstart)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getFullText`](FunctionLikeDeclarationBase.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getFullWidth`](FunctionLikeDeclarationBase.md#getfullwidth)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getLastToken`](FunctionLikeDeclarationBase.md#getlasttoken)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getLeadingTriviaWidth`](FunctionLikeDeclarationBase.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getSourceFile`](FunctionLikeDeclarationBase.md#getsourcefile)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getStart`](FunctionLikeDeclarationBase.md#getstart)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getText`](FunctionLikeDeclarationBase.md#gettext)

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

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`getWidth`](FunctionLikeDeclarationBase.md#getwidth)
