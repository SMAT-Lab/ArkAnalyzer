[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CoreTransformationContext

# Interface: CoreTransformationContext

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4078

## Extended by

- [`TransformationContext`](TransformationContext.md)

## Properties

### factory

> `readonly` **factory**: [`NodeFactory`](NodeFactory.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4079

## Methods

### endLexicalEnvironment()

> **endLexicalEnvironment**(): `undefined` \| [`Statement`](Statement.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4089

Ends a lexical environment, returning any declarations.

#### Returns

`undefined` \| [`Statement`](Statement.md)[]

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4081

Gets the compiler options supplied to the transformer.

#### Returns

[`CompilerOptions`](CompilerOptions.md)

***

### hoistFunctionDeclaration()

> **hoistFunctionDeclaration**(`node`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4091

Hoists a function declaration to the containing scope.

#### Parameters

##### node

[`FunctionDeclaration`](FunctionDeclaration.md)

#### Returns

`void`

***

### hoistVariableDeclaration()

> **hoistVariableDeclaration**(`node`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4093

Hoists a variable declaration to the containing scope.

#### Parameters

##### node

[`Identifier`](Identifier.md)

#### Returns

`void`

***

### resumeLexicalEnvironment()

> **resumeLexicalEnvironment**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4087

Resumes a suspended lexical environment, usually before visiting a function body.

#### Returns

`void`

***

### startLexicalEnvironment()

> **startLexicalEnvironment**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4083

Starts a new lexical environment.

#### Returns

`void`

***

### suspendLexicalEnvironment()

> **suspendLexicalEnvironment**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4085

Suspends the current lexical environment, usually after visiting a parameter list.

#### Returns

`void`
