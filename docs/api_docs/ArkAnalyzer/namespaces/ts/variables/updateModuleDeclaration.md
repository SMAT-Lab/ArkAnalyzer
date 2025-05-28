[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateModuleDeclaration

# Variable: ~~updateModuleDeclaration()~~

> `const` **updateModuleDeclaration**: \{(`node`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md); (`node`, `decorators`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7954

## Call Signature

> (`node`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

### Parameters

#### node

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

[`ModuleName`](../type-aliases/ModuleName.md)

#### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

### Returns

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

## Call Signature

> (`node`, `decorators`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

### Parameters

#### node

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

[`ModuleName`](../type-aliases/ModuleName.md)

#### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

### Returns

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

## Deprecated

Use `factory.updateModuleDeclaration` or the factory supplied by your transformation context instead.
