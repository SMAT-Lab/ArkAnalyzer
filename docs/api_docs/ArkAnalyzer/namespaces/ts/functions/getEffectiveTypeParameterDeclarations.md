[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getEffectiveTypeParameterDeclarations

# Function: getEffectiveTypeParameterDeclarations()

> **getEffectiveTypeParameterDeclarations**(`node`): readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4832

Gets the effective type parameters. If the node was parsed in a
JavaScript file, gets the type parameters from the `@template` tag from JSDoc.

This does *not* return type parameters from a jsdoc reference to a generic type, eg

type Id = <T>(x: T) => T
/**

## Parameters

### node

[`DeclarationWithTypeParameters`](../type-aliases/DeclarationWithTypeParameters.md)

## Returns

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]
