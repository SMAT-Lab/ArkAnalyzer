[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / FunctionTypeNode

# Interface: FunctionTypeNode

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:938

## Extends

- [`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`_declarationBrand`](FunctionOrConstructorTypeNodeBase.md#_declarationbrand)

***

### \_typeNodeBrand

> **\_typeNodeBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:912

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`_typeNodeBrand`](FunctionOrConstructorTypeNodeBase.md#_typenodebrand)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`decorators`](FunctionOrConstructorTypeNodeBase.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`end`](FunctionOrConstructorTypeNodeBase.md#end)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`flags`](FunctionOrConstructorTypeNodeBase.md#flags)

***

### kind

> `readonly` **kind**: [`FunctionType`](../enumerations/SyntaxKind.md#functiontype)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:939

#### Overrides

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`kind`](FunctionOrConstructorTypeNodeBase.md#kind)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`locals`](FunctionOrConstructorTypeNodeBase.md#locals)

***

### ~~modifiers?~~

> `readonly` `optional` **modifiers**: [`NodeArray`](NodeArray.md)\<[`Modifier`](../type-aliases/Modifier.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8408

#### Deprecated

A function type cannot have modifiers

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`modifiers`](FunctionOrConstructorTypeNodeBase.md#modifiers)

***

### name?

> `readonly` `optional` **name**: [`PropertyName`](../type-aliases/PropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:733

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`name`](FunctionOrConstructorTypeNodeBase.md#name)

***

### parameters

> `readonly` **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:735

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`parameters`](FunctionOrConstructorTypeNodeBase.md#parameters)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`parent`](FunctionOrConstructorTypeNodeBase.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`pos`](FunctionOrConstructorTypeNodeBase.md#pos)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`skipCheck`](FunctionOrConstructorTypeNodeBase.md#skipcheck)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`symbol`](FunctionOrConstructorTypeNodeBase.md#symbol)

***

### type

> `readonly` **type**: [`TypeNode`](TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:936

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`type`](FunctionOrConstructorTypeNodeBase.md#type)

***

### typeParameters?

> `readonly` `optional` **typeParameters**: [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:734

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`typeParameters`](FunctionOrConstructorTypeNodeBase.md#typeparameters)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`forEachChild`](FunctionOrConstructorTypeNodeBase.md#foreachchild)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getChildAt`](FunctionOrConstructorTypeNodeBase.md#getchildat)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getChildCount`](FunctionOrConstructorTypeNodeBase.md#getchildcount)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getChildren`](FunctionOrConstructorTypeNodeBase.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getEnd`](FunctionOrConstructorTypeNodeBase.md#getend)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getFirstToken`](FunctionOrConstructorTypeNodeBase.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getFullStart`](FunctionOrConstructorTypeNodeBase.md#getfullstart)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getFullText`](FunctionOrConstructorTypeNodeBase.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getFullWidth`](FunctionOrConstructorTypeNodeBase.md#getfullwidth)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getLastToken`](FunctionOrConstructorTypeNodeBase.md#getlasttoken)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getLeadingTriviaWidth`](FunctionOrConstructorTypeNodeBase.md#getleadingtriviawidth)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getSourceFile`](FunctionOrConstructorTypeNodeBase.md#getsourcefile)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getStart`](FunctionOrConstructorTypeNodeBase.md#getstart)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getText`](FunctionOrConstructorTypeNodeBase.md#gettext)

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

[`FunctionOrConstructorTypeNodeBase`](FunctionOrConstructorTypeNodeBase.md).[`getWidth`](FunctionOrConstructorTypeNodeBase.md#getwidth)
