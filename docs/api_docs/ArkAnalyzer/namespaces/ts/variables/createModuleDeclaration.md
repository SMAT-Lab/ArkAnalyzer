[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createModuleDeclaration

# Variable: ~~createModuleDeclaration()~~

> `const` **createModuleDeclaration**: \{(`modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md); (`decorators`, `modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7949

## Call Signature

> (`modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

[`ModuleName`](../type-aliases/ModuleName.md)

#### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

#### flags?

[`NodeFlags`](../enumerations/NodeFlags.md)

### Returns

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

[`ModuleName`](../type-aliases/ModuleName.md)

#### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

#### flags?

[`NodeFlags`](../enumerations/NodeFlags.md)

### Returns

[`ModuleDeclaration`](../interfaces/ModuleDeclaration.md)

## Deprecated

Use `factory.createModuleDeclaration` or the factory supplied by your transformation context instead.
