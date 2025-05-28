[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TsConfigSourceFile

# Interface: TsConfigSourceFile

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2218

## Extends

- [`JsonSourceFile`](JsonSourceFile.md)

## Properties

### \_declarationBrand

> **\_declarationBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:699

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`_declarationBrand`](JsonSourceFile.md#_declarationbrand)

***

### amdDependencies

> **amdDependencies**: readonly [`AmdDependency`](AmdDependency.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2122

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`amdDependencies`](JsonSourceFile.md#amddependencies)

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

[`JsonSourceFile`](JsonSourceFile.md).[`decorators`](JsonSourceFile.md#decorators)

***

### end

> `readonly` **end**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:103

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`end`](JsonSourceFile.md#end)

***

### endOfFileToken

> `readonly` **endOfFileToken**: [`Token`](Token.md)\<[`EndOfFileToken`](../enumerations/SyntaxKind.md#endoffiletoken)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2119

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`endOfFileToken`](JsonSourceFile.md#endoffiletoken)

***

### extendedSourceFiles?

> `optional` **extendedSourceFiles**: `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2219

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2120

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`fileName`](JsonSourceFile.md#filename)

***

### flags

> `readonly` **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:599

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`flags`](JsonSourceFile.md#flags)

***

### hasNoDefaultLib

> **hasNoDefaultLib**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2137

lib.d.ts should have a reference comment like

 /// <reference no-default-lib="true"/>

If any other file has this comment, it signals not to include lib.d.ts
because this containing file is intended to act as a default library.

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`hasNoDefaultLib`](JsonSourceFile.md#hasnodefaultlib)

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

[`JsonSourceFile`](JsonSourceFile.md).[`impliedNodeFormat`](JsonSourceFile.md#impliednodeformat)

***

### isDeclarationFile

> **isDeclarationFile**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2128

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`isDeclarationFile`](JsonSourceFile.md#isdeclarationfile)

***

### kind

> `readonly` **kind**: [`SourceFile`](../enumerations/SyntaxKind.md#sourcefile)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2117

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`kind`](JsonSourceFile.md#kind)

***

### languageVariant

> **languageVariant**: [`LanguageVariant`](../enumerations/LanguageVariant.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2127

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`languageVariant`](JsonSourceFile.md#languagevariant)

***

### languageVersion

> **languageVersion**: [`ScriptTarget`](../enumerations/ScriptTarget.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2138

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`languageVersion`](JsonSourceFile.md#languageversion)

***

### libReferenceDirectives

> **libReferenceDirectives**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2126

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`libReferenceDirectives`](JsonSourceFile.md#libreferencedirectives)

***

### locals?

> `optional` **locals**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:602

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`locals`](JsonSourceFile.md#locals)

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

[`JsonSourceFile`](JsonSourceFile.md).[`modifiers`](JsonSourceFile.md#modifiers)

***

### moduleName?

> `optional` **moduleName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2123

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`moduleName`](JsonSourceFile.md#modulename)

***

### parent

> `readonly` **parent**: [`Node`](Node.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:600

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`parent`](JsonSourceFile.md#parent)

***

### pos

> `readonly` **pos**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:102

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`pos`](JsonSourceFile.md#pos)

***

### referencedFiles

> **referencedFiles**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2124

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`referencedFiles`](JsonSourceFile.md#referencedfiles)

***

### skipCheck?

> `optional` **skipCheck**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:603

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`skipCheck`](JsonSourceFile.md#skipcheck)

***

### statements

> `readonly` **statements**: [`NodeArray`](NodeArray.md)\<[`JsonObjectExpressionStatement`](JsonObjectExpressionStatement.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2216

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`statements`](JsonSourceFile.md#statements)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:601

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`symbol`](JsonSourceFile.md#symbol)

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2121

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`text`](JsonSourceFile.md#text)

***

### typeReferenceDirectives

> **typeReferenceDirectives**: readonly [`FileReference`](FileReference.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2125

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`typeReferenceDirectives`](JsonSourceFile.md#typereferencedirectives)

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

[`JsonSourceFile`](JsonSourceFile.md).[`forEachChild`](JsonSourceFile.md#foreachchild)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildAt`](JsonSourceFile.md#getchildat)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildCount`](JsonSourceFile.md#getchildcount)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildren`](JsonSourceFile.md#getchildren)

***

### getEnd()

> **getEnd**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6094

#### Returns

`number`

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getEnd`](JsonSourceFile.md#getend)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFirstToken`](JsonSourceFile.md#getfirsttoken)

***

### getFullStart()

> **getFullStart**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6093

#### Returns

`number`

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getFullStart`](JsonSourceFile.md#getfullstart)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFullText`](JsonSourceFile.md#getfulltext)

***

### getFullWidth()

> **getFullWidth**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6096

#### Returns

`number`

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getFullWidth`](JsonSourceFile.md#getfullwidth)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLastToken`](JsonSourceFile.md#getlasttoken)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLeadingTriviaWidth`](JsonSourceFile.md#getleadingtriviawidth)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLineAndCharacterOfPosition`](JsonSourceFile.md#getlineandcharacterofposition)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLineEndOfPosition`](JsonSourceFile.md#getlineendofposition)

***

### getLineStarts()

> **getLineStarts**(): readonly `number`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6159

#### Returns

readonly `number`[]

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getLineStarts`](JsonSourceFile.md#getlinestarts)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getPositionOfLineAndCharacter`](JsonSourceFile.md#getpositionoflineandcharacter)

***

### getSourceFile()

> **getSourceFile**(): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6088

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getSourceFile`](JsonSourceFile.md#getsourcefile)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getStart`](JsonSourceFile.md#getstart)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getText`](JsonSourceFile.md#gettext)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getWidth`](JsonSourceFile.md#getwidth)

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

[`JsonSourceFile`](JsonSourceFile.md).[`update`](JsonSourceFile.md#update)
