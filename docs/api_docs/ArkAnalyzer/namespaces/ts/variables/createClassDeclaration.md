[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createClassDeclaration

# Variable: ~~createClassDeclaration()~~

> `const` **createClassDeclaration**: \{(`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md); (`decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7909

## Call Signature

> (`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### name

`undefined` | `string` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### heritageClauses

`undefined` | readonly [`HeritageClause`](../interfaces/HeritageClause.md)[]

#### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

### Returns

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`undefined` | `string` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### heritageClauses

`undefined` | readonly [`HeritageClause`](../interfaces/HeritageClause.md)[]

#### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

### Returns

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

## Deprecated

Use `factory.createClassDeclaration` or the factory supplied by your transformation context instead.
