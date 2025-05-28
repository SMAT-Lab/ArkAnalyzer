[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / JSDocNamespaceDeclaration

# Interface: JSDocNamespaceDeclaration

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1689

## Extends

- [`ModuleDeclaration`](ModuleDeclaration.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_declarationBrand`](ModuleDeclaration.md#_declarationbrand)

***

### \_statementBrand

> **\_statementBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1471

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_statementBrand`](ModuleDeclaration.md#_statementbrand)

***

### body?

> `readonly` `optional` **body**: [`JSDocNamespaceBody`](../type-aliases/JSDocNamespaceBody.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1691

#### Overrides

[`ModuleDeclaration`](ModuleDeclaration.md).[`body`](ModuleDeclaration.md#body)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`decorators`](ModuleDeclaration.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`end`](ModuleDeclaration.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`flags`](ModuleDeclaration.md#flags)

***

### kind

> `readonly` **kind**: [`ModuleDeclaration`](../enumerations/SyntaxKind.md#moduledeclaration)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1677

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`kind`](ModuleDeclaration.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`locals`](ModuleDeclaration.md#locals)

***

### ~~modifiers?~~

> `readonly` `optional` **modifiers**: [`NodeArray`](NodeArray.md)\<[`Modifier`](../type-aliases/Modifier.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1679

#### Deprecated

`modifiers` has been removed from `Node` and moved to the `Node` subtypes that support them.
Use `ts.canHaveModifiers()` to test whether a `Node` can have modifiers.
Use `ts.getModifiers()` to get the modifiers of a `Node`.

For example:
```ts
const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`modifiers`](ModuleDeclaration.md#modifiers)

***

### name

> `readonly` **name**: [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1690

#### Overrides

[`ModuleDeclaration`](ModuleDeclaration.md).[`name`](ModuleDeclaration.md#name)

***

### parent

> `readonly` **parent**: [`SourceFile`](SourceFile.md) \| [`ModuleBody`](../type-aliases/ModuleBody.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1678

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`parent`](ModuleDeclaration.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`pos`](ModuleDeclaration.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`skipCheck`](ModuleDeclaration.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`symbol`](ModuleDeclaration.md#symbol)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`forEachChild`](ModuleDeclaration.md#foreachchild)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildAt`](ModuleDeclaration.md#getchildat)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildCount`](ModuleDeclaration.md#getchildcount)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildren`](ModuleDeclaration.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`getEnd`](ModuleDeclaration.md#getend)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFirstToken`](ModuleDeclaration.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullStart`](ModuleDeclaration.md#getfullstart)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullText`](ModuleDeclaration.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullWidth`](ModuleDeclaration.md#getfullwidth)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getLastToken`](ModuleDeclaration.md#getlasttoken)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getLeadingTriviaWidth`](ModuleDeclaration.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`getSourceFile`](ModuleDeclaration.md#getsourcefile)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getStart`](ModuleDeclaration.md#getstart)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getText`](ModuleDeclaration.md#gettext)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getWidth`](ModuleDeclaration.md#getwidth)
