[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / AutoAccessorPropertyDeclaration

# Interface: AutoAccessorPropertyDeclaration

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:794

## Extends

- [`PropertyDeclaration`](PropertyDeclaration.md)

## Properties

### \_autoAccessorBrand

> **\_autoAccessorBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:795

***

### \_classElementBrand

> **\_classElementBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1633

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`_classElementBrand`](PropertyDeclaration.md#_classelementbrand)

***

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`_declarationBrand`](PropertyDeclaration.md#_declarationbrand)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`decorators`](PropertyDeclaration.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`end`](PropertyDeclaration.md#end)

***

### exclamationToken?

> `readonly` `optional` **exclamationToken**: [`ExclamationToken`](../type-aliases/ExclamationToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:790

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`exclamationToken`](PropertyDeclaration.md#exclamationtoken)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`flags`](PropertyDeclaration.md#flags)

***

### initializer?

> `readonly` `optional` **initializer**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:792

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`initializer`](PropertyDeclaration.md#initializer)

***

### kind

> `readonly` **kind**: [`PropertyDeclaration`](../enumerations/SyntaxKind.md#propertydeclaration)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:785

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`kind`](PropertyDeclaration.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`locals`](PropertyDeclaration.md#locals)

***

### ~~modifiers?~~

> `readonly` `optional` **modifiers**: [`NodeArray`](NodeArray.md)\<[`ModifierLike`](../type-aliases/ModifierLike.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:787

#### Deprecated

`modifiers` has been removed from `Node` and moved to the `Node` subtypes that support them.
Use `ts.canHaveModifiers()` to test whether a `Node` can have modifiers.
Use `ts.getModifiers()` to get the modifiers of a `Node`.

For example:
```ts
const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`modifiers`](PropertyDeclaration.md#modifiers)

***

### name

> `readonly` **name**: [`PropertyName`](../type-aliases/PropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:788

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`name`](PropertyDeclaration.md#name)

***

### parent

> `readonly` **parent**: [`ClassLikeDeclaration`](../type-aliases/ClassLikeDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:786

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`parent`](PropertyDeclaration.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`pos`](PropertyDeclaration.md#pos)

***

### questionToken?

> `readonly` `optional` **questionToken**: [`QuestionToken`](../type-aliases/QuestionToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:789

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`questionToken`](PropertyDeclaration.md#questiontoken)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`skipCheck`](PropertyDeclaration.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`symbol`](PropertyDeclaration.md#symbol)

***

### type?

> `readonly` `optional` **type**: [`TypeNode`](TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:791

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`type`](PropertyDeclaration.md#type)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`forEachChild`](PropertyDeclaration.md#foreachchild)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildAt`](PropertyDeclaration.md#getchildat)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildCount`](PropertyDeclaration.md#getchildcount)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildren`](PropertyDeclaration.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`getEnd`](PropertyDeclaration.md#getend)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFirstToken`](PropertyDeclaration.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullStart`](PropertyDeclaration.md#getfullstart)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullText`](PropertyDeclaration.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullWidth`](PropertyDeclaration.md#getfullwidth)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getLastToken`](PropertyDeclaration.md#getlasttoken)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getLeadingTriviaWidth`](PropertyDeclaration.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`getSourceFile`](PropertyDeclaration.md#getsourcefile)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getStart`](PropertyDeclaration.md#getstart)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getText`](PropertyDeclaration.md#gettext)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getWidth`](PropertyDeclaration.md#getwidth)
