[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createImportDeclaration

# Variable: ~~createImportDeclaration()~~

> `const` **createImportDeclaration**: \{(`modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](../interfaces/ImportDeclaration.md); (`decorators`, `modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](../interfaces/ImportDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7981

## Call Signature

> (`modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](../interfaces/ImportDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### importClause

`undefined` | [`ImportClause`](../interfaces/ImportClause.md)

#### moduleSpecifier

[`Expression`](../interfaces/Expression.md)

#### assertClause?

[`AssertClause`](../interfaces/AssertClause.md)

### Returns

[`ImportDeclaration`](../interfaces/ImportDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](../interfaces/ImportDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### importClause

`undefined` | [`ImportClause`](../interfaces/ImportClause.md)

#### moduleSpecifier

[`Expression`](../interfaces/Expression.md)

#### assertClause?

[`AssertClause`](../interfaces/AssertClause.md)

### Returns

[`ImportDeclaration`](../interfaces/ImportDeclaration.md)

## Deprecated

Use `factory.createImportDeclaration` or the factory supplied by your transformation context instead.
