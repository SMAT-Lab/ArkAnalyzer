[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createConstructor

# Variable: ~~createConstructor()~~

> `const` **createConstructor**: \{(`modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md); (`decorators`, `modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7545

## Call Signature

> (`modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md)

## Deprecated

Use `factory.createConstructorDeclaration` or the factory supplied by your transformation context instead.
