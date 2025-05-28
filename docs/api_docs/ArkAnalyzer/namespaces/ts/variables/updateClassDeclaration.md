[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateClassDeclaration

# Variable: ~~updateClassDeclaration()~~

> `const` **updateClassDeclaration**: \{(`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md); (`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7914

## Call Signature

> (`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md)

### Parameters

#### node

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### name

`undefined` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### heritageClauses

`undefined` | readonly [`HeritageClause`](../interfaces/HeritageClause.md)[]

#### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

### Returns

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

## Call Signature

> (`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](../interfaces/ClassDeclaration.md)

### Parameters

#### node

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`undefined` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### heritageClauses

`undefined` | readonly [`HeritageClause`](../interfaces/HeritageClause.md)[]

#### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

### Returns

[`ClassDeclaration`](../interfaces/ClassDeclaration.md)

## Deprecated

Use `factory.updateClassDeclaration` or the factory supplied by your transformation context instead.
