[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateClassExpression

# Variable: ~~updateClassExpression()~~

> `const` **updateClassExpression**: (`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`) => [`ClassExpression`](../interfaces/ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8243

## Parameters

### node

[`ClassExpression`](../interfaces/ClassExpression.md)

### modifiers

readonly [`Modifier`](../type-aliases/Modifier.md)[] | `undefined`

### name

[`Identifier`](../interfaces/Identifier.md) | `undefined`

### typeParameters

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[] | `undefined`

### heritageClauses

readonly [`HeritageClause`](../interfaces/HeritageClause.md)[] | `undefined`

### members

readonly [`ClassElement`](../interfaces/ClassElement.md)[]

## Returns

[`ClassExpression`](../interfaces/ClassExpression.md)

## Deprecated

Use `factory.updateClassExpression` or the factory supplied by your transformation context instead.
