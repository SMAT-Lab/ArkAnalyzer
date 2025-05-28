[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ForOfStatement

# Interface: ForOfStatement

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1537

## Extends

- [`IterationStatement`](IterationStatement.md)

## Properties

### \_statementBrand

> **\_statementBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1471

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`_statementBrand`](IterationStatement.md#_statementbrand)

***

### awaitModifier?

> `readonly` `optional` **awaitModifier**: [`AwaitKeyword`](../type-aliases/AwaitKeyword.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1539

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

[`IterationStatement`](IterationStatement.md).[`decorators`](IterationStatement.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`end`](IterationStatement.md#end)

***

### expression

> `readonly` **expression**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1541

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`flags`](IterationStatement.md#flags)

***

### initializer

> `readonly` **initializer**: [`ForInitializer`](../type-aliases/ForInitializer.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1540

***

### kind

> `readonly` **kind**: [`ForOfStatement`](../enumerations/SyntaxKind.md#forofstatement)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1538

#### Overrides

[`IterationStatement`](IterationStatement.md).[`kind`](IterationStatement.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`locals`](IterationStatement.md#locals)

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

[`IterationStatement`](IterationStatement.md).[`modifiers`](IterationStatement.md#modifiers)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`parent`](IterationStatement.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`pos`](IterationStatement.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`skipCheck`](IterationStatement.md#skipcheck)

***

### statement

> `readonly` **statement**: [`Statement`](Statement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:1514

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`statement`](IterationStatement.md#statement)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`symbol`](IterationStatement.md#symbol)

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

[`IterationStatement`](IterationStatement.md).[`forEachChild`](IterationStatement.md#foreachchild)

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

[`IterationStatement`](IterationStatement.md).[`getChildAt`](IterationStatement.md#getchildat)

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

[`IterationStatement`](IterationStatement.md).[`getChildCount`](IterationStatement.md#getchildcount)

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

[`IterationStatement`](IterationStatement.md).[`getChildren`](IterationStatement.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`getEnd`](IterationStatement.md#getend)

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

[`IterationStatement`](IterationStatement.md).[`getFirstToken`](IterationStatement.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`getFullStart`](IterationStatement.md#getfullstart)

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

[`IterationStatement`](IterationStatement.md).[`getFullText`](IterationStatement.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`getFullWidth`](IterationStatement.md#getfullwidth)

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

[`IterationStatement`](IterationStatement.md).[`getLastToken`](IterationStatement.md#getlasttoken)

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

[`IterationStatement`](IterationStatement.md).[`getLeadingTriviaWidth`](IterationStatement.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`IterationStatement`](IterationStatement.md).[`getSourceFile`](IterationStatement.md#getsourcefile)

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

[`IterationStatement`](IterationStatement.md).[`getStart`](IterationStatement.md#getstart)

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

[`IterationStatement`](IterationStatement.md).[`getText`](IterationStatement.md#gettext)

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

[`IterationStatement`](IterationStatement.md).[`getWidth`](IterationStatement.md#getwidth)
