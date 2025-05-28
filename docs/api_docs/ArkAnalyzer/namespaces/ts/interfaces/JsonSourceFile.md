[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / JsonSourceFile

# Interface: JsonSourceFile

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2215

## Extends

- [`SourceFile`](SourceFile.md)

## Extended by

- [`TsConfigSourceFile`](TsConfigSourceFile.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`SourceFile`](SourceFile.md).[`_declarationBrand`](SourceFile.md#_declarationbrand)

***

### amdDependencies

> **amdDependencies**: readonly [`AmdDependency`](AmdDependency.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2122

#### Inherited from

[`SourceFile`](SourceFile.md).[`amdDependencies`](SourceFile.md#amddependencies)

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

[`SourceFile`](SourceFile.md).[`decorators`](SourceFile.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`SourceFile`](SourceFile.md).[`end`](SourceFile.md#end)

***

### endOfFileToken

> `readonly` **endOfFileToken**: [`Token`](Token.md)\<[`EndOfFileToken`](../enumerations/SyntaxKind.md#endoffiletoken)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2119

#### Inherited from

[`SourceFile`](SourceFile.md).[`endOfFileToken`](SourceFile.md#endoffiletoken)

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2120

#### Inherited from

[`SourceFile`](SourceFile.md).[`fileName`](SourceFile.md#filename)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`SourceFile`](SourceFile.md).[`flags`](SourceFile.md#flags)

***

### hasNoDefaultLib

> **hasNoDefaultLib**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2137

lib.d.ts should have a reference comment like

 /// <reference no-default-lib="true"/>

If any other file has this comment, it signals not to include lib.d.ts
because this containing file is intended to act as a default library.

#### Inherited from

[`SourceFile`](SourceFile.md).[`hasNoDefaultLib`](SourceFile.md#hasnodefaultlib)

***

### impliedNodeFormat?

> `optional` **impliedNodeFormat**: [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2156

When `module` is `Node16` or `NodeNext`, this field controls whether the
source file in question is an ESNext-output-format file, or a CommonJS-output-format
module. This is derived by the module resolver as it looks up the file, since
it is derived from either the file extension of the module, or the containing
`package.json` context, and affects both checking and emit.

It is _public_ so that (pre)transformers can set this field,
since it switches the builtin `node` module transform. Generally speaking, if unset,
the field is treated as though it is `ModuleKind.CommonJS`.

Note that this field is only set by the module resolution process when
`moduleResolution` is `Node16` or `NodeNext`, which is implied by the `module` setting
of `Node16` or `NodeNext`, respectively, but may be overriden (eg, by a `moduleResolution`
of `node`). If so, this field will be unset and source files will be considered to be
CommonJS-output-format by the node module transformer and type checker, regardless of extension or context.

#### Inherited from

[`SourceFile`](SourceFile.md).[`impliedNodeFormat`](SourceFile.md#impliednodeformat)

***

### isDeclarationFile

> **isDeclarationFile**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2128

#### Inherited from

[`SourceFile`](SourceFile.md).[`isDeclarationFile`](SourceFile.md#isdeclarationfile)

***

### kind

> `readonly` **kind**: [`SourceFile`](../enumerations/SyntaxKind.md#sourcefile)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2117

#### Inherited from

[`SourceFile`](SourceFile.md).[`kind`](SourceFile.md#kind)

***

### languageVariant

> **languageVariant**: [`LanguageVariant`](../enumerations/LanguageVariant.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2127

#### Inherited from

[`SourceFile`](SourceFile.md).[`languageVariant`](SourceFile.md#languagevariant)

***

### languageVersion

> **languageVersion**: [`ScriptTarget`](../enumerations/ScriptTarget.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2138

#### Inherited from

[`SourceFile`](SourceFile.md).[`languageVersion`](SourceFile.md#languageversion)

***

### libReferenceDirectives

> **libReferenceDirectives**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2126

#### Inherited from

[`SourceFile`](SourceFile.md).[`libReferenceDirectives`](SourceFile.md#libreferencedirectives)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`SourceFile`](SourceFile.md).[`locals`](SourceFile.md#locals)

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

[`SourceFile`](SourceFile.md).[`modifiers`](SourceFile.md#modifiers)

***

### moduleName?

> `optional` **moduleName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2123

#### Inherited from

[`SourceFile`](SourceFile.md).[`moduleName`](SourceFile.md#modulename)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`SourceFile`](SourceFile.md).[`parent`](SourceFile.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`SourceFile`](SourceFile.md).[`pos`](SourceFile.md#pos)

***

### referencedFiles

> **referencedFiles**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2124

#### Inherited from

[`SourceFile`](SourceFile.md).[`referencedFiles`](SourceFile.md#referencedfiles)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`SourceFile`](SourceFile.md).[`skipCheck`](SourceFile.md#skipcheck)

***

### statements

> `readonly` **statements**: [`NodeArray`](NodeArray.md)\<[`JsonObjectExpressionStatement`](JsonObjectExpressionStatement.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2216

#### Overrides

[`SourceFile`](SourceFile.md).[`statements`](SourceFile.md#statements)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`SourceFile`](SourceFile.md).[`symbol`](SourceFile.md#symbol)

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2121

#### Inherited from

[`SourceFile`](SourceFile.md).[`text`](SourceFile.md#text)

***

### typeReferenceDirectives

> **typeReferenceDirectives**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2125

#### Inherited from

[`SourceFile`](SourceFile.md).[`typeReferenceDirectives`](SourceFile.md#typereferencedirectives)

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

[`SourceFile`](SourceFile.md).[`forEachChild`](SourceFile.md#foreachchild)

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

[`SourceFile`](SourceFile.md).[`getChildAt`](SourceFile.md#getchildat)

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

[`SourceFile`](SourceFile.md).[`getChildCount`](SourceFile.md#getchildcount)

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

[`SourceFile`](SourceFile.md).[`getChildren`](SourceFile.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`SourceFile`](SourceFile.md).[`getEnd`](SourceFile.md#getend)

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

[`SourceFile`](SourceFile.md).[`getFirstToken`](SourceFile.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`SourceFile`](SourceFile.md).[`getFullStart`](SourceFile.md#getfullstart)

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

[`SourceFile`](SourceFile.md).[`getFullText`](SourceFile.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`SourceFile`](SourceFile.md).[`getFullWidth`](SourceFile.md#getfullwidth)

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

[`SourceFile`](SourceFile.md).[`getLastToken`](SourceFile.md#getlasttoken)

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

[`SourceFile`](SourceFile.md).[`getLeadingTriviaWidth`](SourceFile.md#getleadingtriviawidth)

***

### getLineAndCharacterOfPosition()

> **getLineAndCharacterOfPosition**(`pos`): [`LineAndCharacter`](LineAndCharacter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6157

#### Parameters

##### pos

`number`

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

#### Inherited from

[`SourceFile`](SourceFile.md).[`getLineAndCharacterOfPosition`](SourceFile.md#getlineandcharacterofposition)

***

### getLineEndOfPosition()

> **getLineEndOfPosition**(`pos`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6158

#### Parameters

##### pos

`number`

#### Returns

`number`

#### Inherited from

[`SourceFile`](SourceFile.md).[`getLineEndOfPosition`](SourceFile.md#getlineendofposition)

***

### getLineStarts()

> **getLineStarts**(): readonly `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6159

#### Returns

readonly `number`[]

#### Inherited from

[`SourceFile`](SourceFile.md).[`getLineStarts`](SourceFile.md#getlinestarts)

***

### getPositionOfLineAndCharacter()

> **getPositionOfLineAndCharacter**(`line`, `character`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6160

#### Parameters

##### line

`number`

##### character

`number`

#### Returns

`number`

#### Inherited from

[`SourceFile`](SourceFile.md).[`getPositionOfLineAndCharacter`](SourceFile.md#getpositionoflineandcharacter)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`SourceFile`](SourceFile.md).[`getSourceFile`](SourceFile.md#getsourcefile)

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

[`SourceFile`](SourceFile.md).[`getStart`](SourceFile.md#getstart)

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

[`SourceFile`](SourceFile.md).[`getText`](SourceFile.md#gettext)

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

[`SourceFile`](SourceFile.md).[`getWidth`](SourceFile.md#getwidth)

***

### update()

> **update**(`newText`, `textChangeRange`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6161

#### Parameters

##### newText

`string`

##### textChangeRange

[`TextChangeRange`](TextChangeRange.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`SourceFile`](SourceFile.md).[`update`](SourceFile.md#update)
