[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / PropertyAssignment

# Interface: PropertyAssignment

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:803

## Extends

- [`ObjectLiteralElement`](ObjectLiteralElement.md).[`JSDocContainer`](JSDocContainer.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`_declarationBrand`](ObjectLiteralElement.md#_declarationbrand)

***

### \_objectLiteralBrand

> **\_objectLiteralBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:798

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`_objectLiteralBrand`](ObjectLiteralElement.md#_objectliteralbrand)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`decorators`](ObjectLiteralElement.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`end`](ObjectLiteralElement.md#end)

***

### ~~exclamationToken?~~

> `readonly` `optional` **exclamationToken**: [`ExclamationToken`](../type-aliases/ExclamationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8396

#### Deprecated

A property assignment cannot have an exclamation token

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`flags`](ObjectLiteralElement.md#flags)

***

### initializer

> `readonly` **initializer**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:807

***

### kind

> `readonly` **kind**: [`PropertyAssignment`](../enumerations/SyntaxKind.md#propertyassignment)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:804

#### Overrides

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`kind`](ObjectLiteralElement.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`locals`](ObjectLiteralElement.md#locals)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`modifiers`](ObjectLiteralElement.md#modifiers)

***

### name

> `readonly` **name**: [`PropertyName`](../type-aliases/PropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:806

#### Overrides

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`name`](ObjectLiteralElement.md#name)

***

### parent

> `readonly` **parent**: [`ObjectLiteralExpression`](ObjectLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:805

#### Overrides

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`parent`](ObjectLiteralElement.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`pos`](ObjectLiteralElement.md#pos)

***

### ~~questionToken?~~

> `readonly` `optional` **questionToken**: [`QuestionToken`](../type-aliases/QuestionToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8394

#### Deprecated

A property assignment cannot have a question token

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`skipCheck`](ObjectLiteralElement.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`symbol`](ObjectLiteralElement.md#symbol)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`forEachChild`](ObjectLiteralElement.md#foreachchild)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getChildAt`](ObjectLiteralElement.md#getchildat)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getChildCount`](ObjectLiteralElement.md#getchildcount)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getChildren`](ObjectLiteralElement.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getEnd`](ObjectLiteralElement.md#getend)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getFirstToken`](ObjectLiteralElement.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getFullStart`](ObjectLiteralElement.md#getfullstart)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getFullText`](ObjectLiteralElement.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getFullWidth`](ObjectLiteralElement.md#getfullwidth)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getLastToken`](ObjectLiteralElement.md#getlasttoken)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getLeadingTriviaWidth`](ObjectLiteralElement.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getSourceFile`](ObjectLiteralElement.md#getsourcefile)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getStart`](ObjectLiteralElement.md#getstart)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getText`](ObjectLiteralElement.md#gettext)

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

[`ObjectLiteralElement`](ObjectLiteralElement.md).[`getWidth`](ObjectLiteralElement.md#getwidth)
