[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / FunctionLikeDeclarationBase

# Interface: FunctionLikeDeclarationBase

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:845

Several node kinds share function-like features such as a signature,
a name, and a body. These nodes should extend FunctionLikeDeclarationBase.
Examples:
- FunctionDeclaration
- MethodDeclaration
- AccessorDeclaration

## Extends

- [`SignatureDeclarationBase`](SignatureDeclarationBase.md)

## Extended by

- [`FunctionDeclaration`](FunctionDeclaration.md)
- [`MethodDeclaration`](MethodDeclaration.md)
- [`ConstructorDeclaration`](ConstructorDeclaration.md)
- [`GetAccessorDeclaration`](GetAccessorDeclaration.md)
- [`SetAccessorDeclaration`](SetAccessorDeclaration.md)
- [`FunctionExpression`](FunctionExpression.md)
- [`ArrowFunction`](ArrowFunction.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`_declarationBrand`](SignatureDeclarationBase.md#_declarationbrand)

***

### \_functionLikeDeclarationBrand

> **\_functionLikeDeclarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:846

***

### asteriskToken?

> `readonly` `optional` **asteriskToken**: [`AsteriskToken`](../type-aliases/AsteriskToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:847

***

### body?

> `readonly` `optional` **body**: [`Expression`](Expression.md) \| [`Block`](Block.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:850

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`decorators`](SignatureDeclarationBase.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`end`](SignatureDeclarationBase.md#end)

***

### exclamationToken?

> `readonly` `optional` **exclamationToken**: [`ExclamationToken`](../type-aliases/ExclamationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:849

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`flags`](SignatureDeclarationBase.md#flags)

***

### kind

> `readonly` **kind**: [`MethodSignature`](../enumerations/SyntaxKind.md#methodsignature) \| [`MethodDeclaration`](../enumerations/SyntaxKind.md#methoddeclaration) \| [`Constructor`](../enumerations/SyntaxKind.md#constructor) \| [`GetAccessor`](../enumerations/SyntaxKind.md#getaccessor) \| [`SetAccessor`](../enumerations/SyntaxKind.md#setaccessor) \| [`CallSignature`](../enumerations/SyntaxKind.md#callsignature) \| [`ConstructSignature`](../enumerations/SyntaxKind.md#constructsignature) \| [`IndexSignature`](../enumerations/SyntaxKind.md#indexsignature) \| [`FunctionType`](../enumerations/SyntaxKind.md#functiontype) \| [`ConstructorType`](../enumerations/SyntaxKind.md#constructortype) \| [`FunctionExpression`](../enumerations/SyntaxKind.md#functionexpression) \| [`ArrowFunction`](../enumerations/SyntaxKind.md#arrowfunction) \| [`FunctionDeclaration`](../enumerations/SyntaxKind.md#functiondeclaration) \| [`JSDocFunctionType`](../enumerations/SyntaxKind.md#jsdocfunctiontype)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:732

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`kind`](SignatureDeclarationBase.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`locals`](SignatureDeclarationBase.md#locals)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`modifiers`](SignatureDeclarationBase.md#modifiers)

***

### name?

> `readonly` `optional` **name**: [`PropertyName`](../type-aliases/PropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:733

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`name`](SignatureDeclarationBase.md#name)

***

### parameters

> `readonly` **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:735

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`parameters`](SignatureDeclarationBase.md#parameters)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`parent`](SignatureDeclarationBase.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`pos`](SignatureDeclarationBase.md#pos)

***

### questionToken?

> `readonly` `optional` **questionToken**: [`QuestionToken`](../type-aliases/QuestionToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:848

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`skipCheck`](SignatureDeclarationBase.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`symbol`](SignatureDeclarationBase.md#symbol)

***

### type?

> `readonly` `optional` **type**: [`TypeNode`](TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:736

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`type`](SignatureDeclarationBase.md#type)

***

### typeParameters?

> `readonly` `optional` **typeParameters**: [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:734

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`typeParameters`](SignatureDeclarationBase.md#typeparameters)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`forEachChild`](SignatureDeclarationBase.md#foreachchild)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildAt`](SignatureDeclarationBase.md#getchildat)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildCount`](SignatureDeclarationBase.md#getchildcount)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildren`](SignatureDeclarationBase.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getEnd`](SignatureDeclarationBase.md#getend)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFirstToken`](SignatureDeclarationBase.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullStart`](SignatureDeclarationBase.md#getfullstart)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullText`](SignatureDeclarationBase.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullWidth`](SignatureDeclarationBase.md#getfullwidth)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getLastToken`](SignatureDeclarationBase.md#getlasttoken)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getLeadingTriviaWidth`](SignatureDeclarationBase.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getSourceFile`](SignatureDeclarationBase.md#getsourcefile)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getStart`](SignatureDeclarationBase.md#getstart)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getText`](SignatureDeclarationBase.md#gettext)

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

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getWidth`](SignatureDeclarationBase.md#getwidth)
