[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createClassExpression

# Variable: ~~createClassExpression()~~

> `const` **createClassExpression**: (`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`) => [`ClassExpression`](../interfaces/ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8241

## Parameters

### modifiers

readonly [`Modifier`](../type-aliases/Modifier.md)[] | `undefined`

### name

`string` | [`Identifier`](../interfaces/Identifier.md) | `undefined`

### typeParameters

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[] | `undefined`

### heritageClauses

readonly [`HeritageClause`](../interfaces/HeritageClause.md)[] | `undefined`

### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

## Returns

[`ClassExpression`](../interfaces/ClassExpression.md)

## Deprecated

Use `factory.createClassExpression` or the factory supplied by your transformation context instead.
