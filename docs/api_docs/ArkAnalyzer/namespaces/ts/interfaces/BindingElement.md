[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / BindingElement

# Interface: BindingElement

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:769

## Extends

- [`NamedDeclaration`](NamedDeclaration.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`_declarationBrand`](NamedDeclaration.md#_declarationbrand)

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

[`NamedDeclaration`](NamedDeclaration.md).[`decorators`](NamedDeclaration.md#decorators)

***

### dotDotDotToken?

> `readonly` `optional` **dotDotDotToken**: [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:773

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`end`](NamedDeclaration.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`flags`](NamedDeclaration.md#flags)

***

### initializer?

> `readonly` `optional` **initializer**: [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:775

***

### kind

> `readonly` **kind**: [`BindingElement`](../enumerations/SyntaxKind.md#bindingelement)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:770

#### Overrides

[`NamedDeclaration`](NamedDeclaration.md).[`kind`](NamedDeclaration.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`locals`](NamedDeclaration.md#locals)

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

[`NamedDeclaration`](NamedDeclaration.md).[`modifiers`](NamedDeclaration.md#modifiers)

***

### name

> `readonly` **name**: [`BindingName`](../type-aliases/BindingName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:774

#### Overrides

[`NamedDeclaration`](NamedDeclaration.md).[`name`](NamedDeclaration.md#name)

***

### parent

> `readonly` **parent**: [`BindingPattern`](../type-aliases/BindingPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:771

#### Overrides

[`NamedDeclaration`](NamedDeclaration.md).[`parent`](NamedDeclaration.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`pos`](NamedDeclaration.md#pos)

***

### propertyName?

> `readonly` `optional` **propertyName**: [`PropertyName`](../type-aliases/PropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:772

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`skipCheck`](NamedDeclaration.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`symbol`](NamedDeclaration.md#symbol)

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

[`NamedDeclaration`](NamedDeclaration.md).[`forEachChild`](NamedDeclaration.md#foreachchild)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getChildAt`](NamedDeclaration.md#getchildat)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getChildCount`](NamedDeclaration.md#getchildcount)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getChildren`](NamedDeclaration.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`getEnd`](NamedDeclaration.md#getend)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getFirstToken`](NamedDeclaration.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`getFullStart`](NamedDeclaration.md#getfullstart)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getFullText`](NamedDeclaration.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`getFullWidth`](NamedDeclaration.md#getfullwidth)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getLastToken`](NamedDeclaration.md#getlasttoken)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getLeadingTriviaWidth`](NamedDeclaration.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`NamedDeclaration`](NamedDeclaration.md).[`getSourceFile`](NamedDeclaration.md#getsourcefile)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getStart`](NamedDeclaration.md#getstart)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getText`](NamedDeclaration.md#gettext)

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

[`NamedDeclaration`](NamedDeclaration.md).[`getWidth`](NamedDeclaration.md#getwidth)
